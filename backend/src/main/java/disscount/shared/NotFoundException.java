package disscount.shared;

/** Replaces ForbiddenException where a 403 would confirm something exists, so an id tells a stranger nothing. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
