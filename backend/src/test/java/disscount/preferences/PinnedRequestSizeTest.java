package disscount.preferences;

import java.util.List;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// The columns are varchar(255), so a longer value would fail the insert with a 500 instead of a form error.
class PinnedRequestSizeTest {

    private static final String TOO_LONG = "a".repeat(256);
    private static final String LONGEST = "a".repeat(255);

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void aPinnedPlaceLongerThanItsColumnIsAFormError() {
        BulkPinnedPlaceRequest request = new BulkPinnedPlaceRequest(List.of(new PinnedPlaceRequest(TOO_LONG, TOO_LONG)));

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactlyInAnyOrder("places[0].placeApiId", "places[0].placeName");
    }

    @Test
    void aPinnedStoreLongerThanItsColumnIsAFormError() {
        BulkPinnedStoreRequest request = new BulkPinnedStoreRequest(List.of(new PinnedStoreRequest(TOO_LONG, TOO_LONG)));

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactlyInAnyOrder("stores[0].storeApiId", "stores[0].storeName");
    }

    @Test
    void valuesThatFillTheColumnAreValid() {
        assertThat(validator.validate(new BulkPinnedPlaceRequest(List.of(new PinnedPlaceRequest(LONGEST, LONGEST)))))
                .isEmpty();
        assertThat(validator.validate(new BulkPinnedStoreRequest(List.of(new PinnedStoreRequest(LONGEST, LONGEST)))))
                .isEmpty();
    }
}
