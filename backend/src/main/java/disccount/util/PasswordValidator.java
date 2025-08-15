package disccount.util;

import disccount.exceptions.BadRequestException;

import java.util.ArrayList;
import java.util.List;

/**
 * Simple password strength validator.
 * Rules (configurable later):
 * - Minimum length 8
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
public final class PasswordValidator {

    private PasswordValidator() {}

    public static void validateOrThrow(String password) {
        List<String> failures = validate(password);
        if (!failures.isEmpty()) {
            throw new BadRequestException("Weak password: " + String.join("; ", failures));
        }
    }

    public static List<String> validate(String password) {
        List<String> failures = new ArrayList<>();
        if (password == null) {
            failures.add("password is required");
            return failures;
        }

        if (password.length() < 12) {
            failures.add("must be at least 12 characters");
        }
        if (!password.chars().anyMatch(Character::isUpperCase)) {
            failures.add("must contain an uppercase letter");
        }
        if (!password.chars().anyMatch(Character::isLowerCase)) {
            failures.add("must contain a lowercase letter");
        }
        if (!password.chars().anyMatch(Character::isDigit)) {
            failures.add("must contain a digit");
        }
        // Character class must escape [, ], -, and backslash correctly.
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\,.<>/?].*")) {
            failures.add("must contain a special character (e.g. !@#$%)");
        }

        return failures;
    }
}
