package disscount.exceptions;

/**
 * The resource does not exist, or the caller has no business knowing that it does.
 *
 * <p>Deliberately used in place of {@link ForbiddenException} where a 403 would confirm that
 * something exists: a private shopping list answers the same way as an id that was never
 * real, so holding an id tells a stranger nothing.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
