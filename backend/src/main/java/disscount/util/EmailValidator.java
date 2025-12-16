package disscount.util;

import java.util.ArrayList;
import java.util.List;

import disscount.exceptions.BadRequestException;

/**
 * Simple email validator with conservative checks.
 */
public final class EmailValidator {

    private static final int MAX_LENGTH = 254;
    private static final int MAX_LOCAL_PART = 64;

    private EmailValidator() {}

    public static void validateOrThrow(String email) {
        List<String> failures = validate(email);
        if (!failures.isEmpty()) {
            throw new BadRequestException("Invalid email: " + String.join("; ", failures));
        }
    }

    public static List<String> validate(String email) {
        List<String> failures = new ArrayList<>();
        if (email == null || email.trim().isEmpty()) {
            failures.add("email is required");
            return failures;
        }

        String e = email.trim();

        if (e.length() > MAX_LENGTH) {
            failures.add("must be at most " + MAX_LENGTH + " characters");
        }

        String[] parts = e.split("@", -1);
        if (parts.length != 2) {
            failures.add("must contain a single @ character");
            return failures;
        }

        String local = parts[0];
        String domain = parts[1];

        if (local.length() == 0) {
            failures.add("local part is empty");
        }
        if (local.length() > MAX_LOCAL_PART) {
            failures.add("local part must be at most " + MAX_LOCAL_PART + " characters");
        }
        if (local.startsWith(".") || local.endsWith(".")) {
            failures.add("local part must not start or end with a dot");
        }
        if (local.contains("..")) {
            failures.add("local part must not contain consecutive dots");
        }

        // Basic domain checks: letters/numbers/dots/hyphens and a TLD
        if (domain.length() == 0) {
            failures.add("domain part is empty");
        } else {
            if (domain.contains("..")) {
                failures.add("domain must not contain consecutive dots");
            }
            if (!domain.matches("^[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                failures.add("domain must be valid and contain a TLD");
            }
        }

        return failures;
    }
}
