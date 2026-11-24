package disscount.shoppinglist;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// The list form allows 100 characters, so the backend holds the same line for anyone calling the API directly.
class ShoppingListTitleLengthTest {

    private static final String TOO_LONG = "a".repeat(101);
    private static final String LONGEST = "a".repeat(100);

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void aListTitleOverAHundredCharactersIsAFormError() {
        assertThat(validator.validate(new ShoppingListRequest(TOO_LONG, null)))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("title");
    }

    @Test
    void aCopyTitleOverAHundredCharactersIsAFormError() {
        assertThat(validator.validate(copyTitled(TOO_LONG)))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("title");
    }

    @Test
    void aHundredCharacterTitleIsValid() {
        assertThat(validator.validate(new ShoppingListRequest(LONGEST, null))).isEmpty();
        assertThat(validator.validate(copyTitled(LONGEST))).isEmpty();
    }

    private static ShoppingListCopyRequest copyTitled(String title) {
        ShoppingListCopyRequest request = new ShoppingListCopyRequest();
        request.setTitle(title);

        return request;
    }
}
