package disscount.shoppinglist;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ShoppingListItemRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void aPlainItemWithoutAnEanIsValid() {
        ShoppingListItemRequest request = item(null, "Staklenke");

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void anItemStillNeedsAName() {
        ShoppingListItemRequest request = item("3850000000001", " ");

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("name");
    }

    private static ShoppingListItemRequest item(String ean, String name) {
        return new ShoppingListItemRequest(ean, null, name, null, null, null, null, null, null, null);
    }
}
