package disscount.productimage;

/** The renderer failed on bytes it had read: a fault of that photo, which the next tick would only repeat. */
class PhotoRenderFailedException extends RuntimeException {

    PhotoRenderFailedException(Throwable cause) {
        super(cause.getMessage(), cause);
    }
}
