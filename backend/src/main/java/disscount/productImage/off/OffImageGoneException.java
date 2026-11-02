package disscount.productImage.off;

/** Open Food Facts no longer has the file, or has one we will never accept, so retrying is pointless. */
public class OffImageGoneException extends RuntimeException {

    public OffImageGoneException(String url, int status) {
        super(url + " answered " + status);
    }

    public OffImageGoneException(String message) {
        super(message);
    }
}
