package disscount.digitalCard.photo;

/** Sanitised bytes ready to store, never the client's original. */
public record ValidatedPhoto(byte[] bytes, String contentType, String extension, int width, int height) {}
