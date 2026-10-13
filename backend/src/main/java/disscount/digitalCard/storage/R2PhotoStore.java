package disscount.digitalCard.storage;

import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.util.Optional;

public class R2PhotoStore implements PhotoStore, AutoCloseable {

    private final S3Client s3;
    private final String bucket;

    public R2PhotoStore(S3Client s3, String bucket) {
        this.s3 = s3;
        this.bucket = bucket;
    }

    @Override
    public boolean enabled() {
        return true;
    }

    @Override
    public void put(String key, byte[] bytes, String contentType) {
        s3.putObject(
                PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build(),
                RequestBody.fromBytes(bytes));
    }

    @Override
    public Optional<StoredPhoto> get(String key) {
        try {
            ResponseInputStream<GetObjectResponse> object =
                    s3.getObject(GetObjectRequest.builder().bucket(bucket).key(key).build());
            GetObjectResponse head = object.response();
            return Optional.of(new StoredPhoto(object, head.contentLength(), head.contentType()));
        } catch (NoSuchKeyException missing) {
            return Optional.empty();
        }
    }

    @Override
    public void delete(String key) {
        s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }

    // One DeleteObject per key: the DeleteObjects batch call needs a Content-MD5 or checksum
    // header that R2 handles differently from S3, and a user rarely owns more than a few dozen objects.
    @Override
    public void deletePrefix(String prefix) {
        ListObjectsV2Request list = ListObjectsV2Request.builder().bucket(bucket).prefix(prefix).build();
        for (S3Object object : s3.listObjectsV2Paginator(list).contents()) {
            delete(object.key());
        }
    }

    @Override
    public void close() {
        s3.close();
    }
}
