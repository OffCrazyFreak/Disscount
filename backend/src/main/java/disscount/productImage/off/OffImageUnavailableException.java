package disscount.productImage.off;

/** Open Food Facts refused or failed one image download; a later try may work, so it is not given up like a gone one. */
public class OffImageUnavailableException extends IllegalStateException {

    public OffImageUnavailableException(String url, int status) {
        super(url + " answered " + status);
    }
}
