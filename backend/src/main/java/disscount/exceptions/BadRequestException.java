package disscount.exceptions;

public class BadRequestException extends RuntimeException {

    private final Object[] args;

    public BadRequestException(String message) {
        super(message);
        this.args = new Object[0];
    }

    /** The arguments fill the {0}, {1} placeholders of the message code. */
    public BadRequestException(String message, String... args) {
        super(message);
        this.args = args;
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
        this.args = new Object[0];
    }

    public Object[] getArgs() {
        return args;
    }
}
