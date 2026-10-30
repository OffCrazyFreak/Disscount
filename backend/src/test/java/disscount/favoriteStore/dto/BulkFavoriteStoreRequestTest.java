package disscount.favoriteStore.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

class BulkFavoriteStoreRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void aNullStoreIsAValidationErrorNotAServerError() {
        BulkFavoriteStoreRequest request = new BulkFavoriteStoreRequest();
        request.setStores(Arrays.asList((FavoriteStoreRequest) null));

        assertThat(validator.validate(request)).isNotEmpty();
    }
}
