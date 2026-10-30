package disscount.digitalCard.dto;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class NoNulValidator implements ConstraintValidator<NoNul, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || value.indexOf('\u0000') < 0;
    }
}
