package disscount.shared;

public class LimitReachedException extends ConflictException {

    private final UserLimit limit;

    public LimitReachedException(UserLimit limit) {
        super(limit.code());
        this.limit = limit;
    }

    public UserLimit getLimit() {
        return limit;
    }
}
