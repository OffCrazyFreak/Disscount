package disscount.shared.photo;

import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.channels.Channels;
import java.nio.channels.FileChannel;
import java.nio.file.DirectoryNotEmptyException;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.PosixFilePermission;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/** A key is a path below the base, inside one named folder, so one store can never reach another's files. */
public final class AtomicFileStore {

    /** Backups must skip files with this name prefix; they are unfinished writes. */
    public static final String TEMP_FILE_PREFIX = ".tmp-";

    // Keys come from our code, so anything else is a bug or an attack. A leading dot is refused, which rules out "..".
    private static final Pattern SAFE_KEY =
            Pattern.compile("[A-Za-z0-9][A-Za-z0-9._-]*(/[A-Za-z0-9][A-Za-z0-9._-]*)+");

    /** The nginx container reads public files under another uid, so only those may be readable by others. */
    public enum Visibility {
        OWNER_ONLY("rw-------", "rwx------"),
        WORLD_READABLE("rw-r--r--", "rwxr-xr-x");

        private final Set<PosixFilePermission> filePermissions;
        private final Set<PosixFilePermission> directoryPermissions;

        Visibility(String file, String directory) {
            this.filePermissions = PosixFilePermissions.fromString(file);
            this.directoryPermissions = PosixFilePermissions.fromString(directory);
        }
    }

    public record OpenedFile(InputStream stream, long size) {}

    private final Path base;
    private final Path folder;
    private final Visibility visibility;

    public AtomicFileStore(Path base, String folderName, Visibility visibility) {
        this.base = base.toAbsolutePath().normalize();
        this.folder = this.base.resolve(folderName);
        this.visibility = visibility;
    }

    /** Never created here: a missing folder means an unmounted volume, and files written then vanish on deploy. */
    public boolean isAvailable() {
        return Files.isDirectory(folder) && Files.isWritable(folder);
    }

    /** Readers see the old file or the whole new one, and a crash after this returns cannot lose the file. */
    public void write(String key, byte[] bytes) throws IOException {
        Path target = resolve(key);
        if (!Files.isDirectory(folder)) throw new NoSuchFileException(folder.toString());
        Path directory = target.getParent();
        createMissingDirectories(directory);

        // Beside the target, so the rename cannot cross filesystems and an erasure prefix delete also takes leftovers.
        Path temp = directory.resolve(TEMP_FILE_PREFIX + UUID.randomUUID());
        try {
            writeAndSync(temp, bytes);
            Files.move(temp, target, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException | RuntimeException e) {
            deleteQuietly(temp, e);
            throw e;
        }
        syncDirectory(directory);
    }

    public Optional<OpenedFile> open(String key) throws IOException {
        Path file = resolve(key);
        if (!Files.isRegularFile(file)) return Optional.empty();

        FileChannel channel;
        try {
            channel = FileChannel.open(file, StandardOpenOption.READ);
        } catch (NoSuchFileException deletedMeanwhile) {
            return Optional.empty();
        }
        try {
            return Optional.of(new OpenedFile(Channels.newInputStream(channel), channel.size()));
        } catch (IOException e) {
            channel.close();
            throw e;
        }
    }

    public void delete(String key) throws IOException {
        Path file = resolve(key);
        if (Files.deleteIfExists(file)) syncDirectory(file.getParent());
    }

    /** Takes a directory style prefix with its trailing slash, never the store's whole folder. */
    public void deletePrefix(String prefix) throws IOException {
        if (!prefix.endsWith("/")) throw new IllegalArgumentException("Prefix must end with a slash: " + prefix);
        Path directory = resolve(prefix.substring(0, prefix.length() - 1));

        Files.walkFileTree(directory, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attributes) throws IOException {
                Files.deleteIfExists(file);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFileFailed(Path file, IOException e) throws IOException {
                if (e instanceof NoSuchFileException) return FileVisitResult.CONTINUE;
                throw e;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path visited, IOException e) throws IOException {
                if (e != null) throw e;
                try {
                    Files.deleteIfExists(visited);
                } catch (DirectoryNotEmptyException uploadRacedTheDelete) {
                    // That upload's row write fails on the deleted card, dropping the file; the walk must still finish.
                }
                return FileVisitResult.CONTINUE;
            }
        });
        if (Files.isDirectory(directory.getParent())) syncDirectory(directory.getParent());
    }

    private Path resolve(String key) {
        if (key == null || !SAFE_KEY.matcher(key).matches()) {
            throw new IllegalArgumentException("Unsafe storage key: " + key);
        }
        Path path = base.resolve(key).normalize();
        if (!path.startsWith(folder) || path.equals(folder)) {
            throw new IllegalArgumentException("Storage key is outside its folder: " + key);
        }
        return path;
    }

    private void createMissingDirectories(Path directory) throws IOException {
        if (Files.isDirectory(directory)) return;
        createMissingDirectories(directory.getParent());
        try {
            Files.createDirectory(directory, PosixFilePermissions.asFileAttribute(visibility.directoryPermissions));
            // The umask can only narrow what createDirectory asks for, and nginx needs the full public mode.
            Files.setPosixFilePermissions(directory, visibility.directoryPermissions);
            syncDirectory(directory.getParent());
        } catch (FileAlreadyExistsException createdByAnotherUpload) {
            if (!Files.isDirectory(directory)) throw createdByAnotherUpload;
        }
    }

    private void writeAndSync(Path temp, byte[] bytes) throws IOException {
        try (FileChannel channel = FileChannel.open(temp, Set.of(StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE),
                PosixFilePermissions.asFileAttribute(visibility.filePermissions))) {
            Files.setPosixFilePermissions(temp, visibility.filePermissions);
            ByteBuffer buffer = ByteBuffer.wrap(bytes);
            while (buffer.hasRemaining()) channel.write(buffer);
            channel.force(true);
        }
    }

    // A rename or new entry is durable only once its directory is synced; opening a directory works on Linux only.
    private static void syncDirectory(Path directory) throws IOException {
        try (FileChannel channel = FileChannel.open(directory, StandardOpenOption.READ)) {
            channel.force(true);
        }
    }

    private static void deleteQuietly(Path temp, Exception cause) {
        try {
            Files.deleteIfExists(temp);
        } catch (IOException e) {
            cause.addSuppressed(e);
        }
    }
}
