package disscount.productImage.off;

/** Open Food Facts no longer has the file, so retrying is pointless. */
public class OffImageGoneException extends RuntimeException {

    public OffImageGoneException(String url, int status) {
        super(url + " answered " + status);
    }
}
