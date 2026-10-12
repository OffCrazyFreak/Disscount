package disscount.digitalCard.dto;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidDateRangeValidator implements ConstraintValidator<ValidDateRange, DigitalCardRequest> {

    @Override
    public boolean isValid(DigitalCardRequest request, ConstraintValidatorContext context) {
        if (request.getValidFrom() == null || request.getExpiresOn() == null
                || !request.getExpiresOn().isBefore(request.getValidFrom())) {
            return true;
        }

        // Reported on expiresOn so the frontend can map the message onto that form field.
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                .addPropertyNode("expiresOn")
                .addConstraintViolation();
        return false;
    }
}
