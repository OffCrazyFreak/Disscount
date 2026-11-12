package disscount.digitalcard;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

class ValidDateRangeValidator implements ConstraintValidator<ValidDateRange, DigitalCardRequest> {

    @Override
    public boolean isValid(DigitalCardRequest request, ConstraintValidatorContext context) {
        if (request.validFrom() == null || request.expiresOn() == null
                || !request.expiresOn().isBefore(request.validFrom())) {
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
