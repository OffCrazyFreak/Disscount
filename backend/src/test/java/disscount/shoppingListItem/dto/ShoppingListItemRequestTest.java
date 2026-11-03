package disscount.shoppingListItem.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ShoppingListItemRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void aPlainItemWithoutAnEanIsValid() {
        ShoppingListItemRequest request = new ShoppingListItemRequest();
        request.setName("Staklenke");

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void anItemStillNeedsAName() {
        ShoppingListItemRequest request = new ShoppingListItemRequest();
        request.setEan("3850000000001");
        request.setName(" ");

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactly("name");
    }
}
