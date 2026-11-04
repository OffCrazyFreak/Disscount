package disscount.exceptions;

/** Used in place of ForbiddenException where a 403 would confirm something exists, so holding an id tells a stranger nothing. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
