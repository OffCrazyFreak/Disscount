package disscount.watchlist;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class WatchlistItemRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    // The column is varchar(255), so a longer id would fail the insert with a 500 instead of a form error.
    @Test
    void aProductIdLongerThanItsColumnIsAFormError() {
        WatchlistItemRequest request = new WatchlistItemRequest("1".repeat(256), WatchType.ABSOLUTE, 1.0);

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("productApiId");
    }

    @Test
    void aProductIdThatFillsTheColumnIsValid() {
        assertThat(validator.validate(new WatchlistItemRequest("1".repeat(255), WatchType.ABSOLUTE, 1.0))).isEmpty();
    }

    // A drop of more than 100% can never happen, so such an alert would never fire.
    @Test
    void aPercentageAlertOverAHundredIsAFormError() {
        assertThat(validator.validate(new WatchlistItemRequest("3850123456789", WatchType.PERCENTAGE, 100.5)))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("thresholdValue");
    }

    @Test
    void aHundredPercentAlertIsValid() {
        assertThat(validator.validate(new WatchlistItemRequest("3850123456789", WatchType.PERCENTAGE, 100.0))).isEmpty();
    }

    @Test
    void anAbsoluteAlertOverAHundredEurosStaysValid() {
        assertThat(validator.validate(new WatchlistItemRequest("3850123456789", WatchType.ABSOLUTE, 500.0))).isEmpty();
    }
}
