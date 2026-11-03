package disscount.productImage.storage;

import java.util.Optional;

import disscount.digitalCard.storage.StoredPhoto;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

public class R2ProductOriginalStore implements ProductOriginalStore, AutoCloseable {

    private final S3Client s3;
    private final String bucket;

    public R2ProductOriginalStore(S3Client s3, String bucket) {
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

    @Override
    public void close() {
        s3.close();
    }
}
