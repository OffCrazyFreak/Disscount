package disscount.preferences.pinnedstore;

import java.util.List;
import java.util.stream.IntStream;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// The columns are varchar(255), so a longer value would fail the insert with a 500 instead of a form error.
class PinnedStoreRequestSizeTest {

    private static final String TOO_LONG = "a".repeat(256);
    private static final String LONGEST = "a".repeat(255);

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void aPinnedStoreLongerThanItsColumnIsAFormError() {
        BulkPinnedStoreRequest request = new BulkPinnedStoreRequest(List.of(new PinnedStoreRequest(TOO_LONG, TOO_LONG)));

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactlyInAnyOrder("stores[0].storeApiId", "stores[0].storeName");
    }

    @Test
    void valuesThatFillTheColumnAreValid() {
        assertThat(validator.validate(new BulkPinnedStoreRequest(List.of(new PinnedStoreRequest(LONGEST, LONGEST)))))
                .isEmpty();
    }

    @Test
    void moreThanFiftyPinnedStoresIsAFormError() {
        assertThat(validator.validate(new BulkPinnedStoreRequest(pinned(51))))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("stores");
    }

    @Test
    void fiftyPinnedStoresAreValid() {
        assertThat(validator.validate(new BulkPinnedStoreRequest(pinned(50)))).isEmpty();
    }

    private static List<PinnedStoreRequest> pinned(int count) {
        return IntStream.range(0, count)
                .mapToObj(index -> new PinnedStoreRequest("store-" + index, "Store " + index))
                .toList();
    }
}
