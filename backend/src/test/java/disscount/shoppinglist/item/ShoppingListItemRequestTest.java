package disscount.shoppinglist.item;

import java.math.BigDecimal;

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

    @Test
    void aNegativePriceIsAFormError() {
        ShoppingListItemRequest request = priced(new BigDecimal("-0.01"), new BigDecimal("-1"));

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactlyInAnyOrder("avgPrice", "storePrice");
    }

    // numeric(10, 4) holds six digits before the point; a larger value would fail the insert with a 500.
    @Test
    void aPriceTooLargeForItsColumnIsAFormError() {
        ShoppingListItemRequest request = priced(new BigDecimal("1000000"), new BigDecimal("999999.99995"));

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactlyInAnyOrder("avgPrice", "storePrice");
    }

    @Test
    void anAverageWithMoreDecimalsThanTheColumnKeepsIsValid() {
        ShoppingListItemRequest request = priced(new BigDecimal("1.2333333333333333"), new BigDecimal("999999.9999"));

        assertThat(validator.validate(request)).isEmpty();
    }

    // The text columns are varchar(255), and anyone with a shop level link can send these fields.
    @Test
    void textLongerThanItsColumnIsAFormError() {
        String tooLong = "a".repeat(256);
        ShoppingListItemRequest request = new ShoppingListItemRequest(
                tooLong, tooLong, tooLong, tooLong, tooLong, null, null, tooLong, null, null);

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .containsExactlyInAnyOrder("ean", "brand", "name", "quantity", "unit", "chainCode");
    }

    @Test
    void textThatFillsTheColumnIsValid() {
        String longest = "a".repeat(255);
        ShoppingListItemRequest request = new ShoppingListItemRequest(
                longest, longest, longest, longest, longest, null, null, longest, null, null);

        assertThat(validator.validate(request)).isEmpty();
    }

    private static ShoppingListItemRequest item(String ean, String name) {
        return new ShoppingListItemRequest(ean, null, name, null, null, null, null, null, null, null);
    }

    private static ShoppingListItemRequest priced(BigDecimal avgPrice, BigDecimal storePrice) {
        return new ShoppingListItemRequest(null, null, "Mlijeko", null, null, null, null, null, avgPrice, storePrice);
    }
}
