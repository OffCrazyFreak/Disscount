package disscount.user.service;

/** A token for an account whose app data was erased while its login survived. */
public class AccountErasedException extends RuntimeException {

    public AccountErasedException() {
        super("account_erased");
    }
}
