package disscount.watchlist;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

// Public because a plain Bean Validation factory, as used in tests, can only call a public constructor.
public class PercentageAtMostHundredValidator implements ConstraintValidator<PercentageAtMostHundred, WatchlistItemRequest> {

    private static final double MAX_PERCENTAGE = 100;

    @Override
    public boolean isValid(WatchlistItemRequest request, ConstraintValidatorContext context) {
        if (request.watchType() != WatchType.PERCENTAGE
                || request.thresholdValue() == null
                || request.thresholdValue() <= MAX_PERCENTAGE) {
            return true;
        }

        // Reported on thresholdValue so the frontend can map the message onto that form field.
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                .addPropertyNode("thresholdValue")
                .addConstraintViolation();

        return false;
    }
}
