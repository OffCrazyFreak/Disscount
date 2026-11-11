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
}
