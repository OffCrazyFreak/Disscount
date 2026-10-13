package disscount.digitalCard.dto;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class TrimmedLengthValidator implements ConstraintValidator<TrimmedLength, String> {

    private int min;
    private int max;

    @Override
    public void initialize(TrimmedLength annotation) {
        min = annotation.min();
        max = annotation.max();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) return true;
        int length = value.trim().length();
        return length >= min && length <= max;
    }
}
