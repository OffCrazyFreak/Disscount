package disscount.exceptions;

import disscount.shoppingList.domain.ShoppingList;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.StaticMessageSource;
import org.springframework.http.ProblemDetail;
import org.springframework.transaction.TransactionSystemException;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerEntityValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private GlobalExceptionHandler handler() {
        StaticMessageSource messages = new StaticMessageSource();
        messages.addMessage("validation.title.required", Locale.ENGLISH, "Title is required.");
        messages.addMessage("problem.detail.validation", Locale.ENGLISH, "Check the highlighted fields.");
        messages.addMessage("problem.title.validation", Locale.ENGLISH, "Invalid input");
        LocaleContextHolder.setLocale(Locale.ENGLISH);
        return new GlobalExceptionHandler(messages);
    }

    private ConstraintViolationException blankListViolations() {
        ShoppingList list = ShoppingList.builder().title(" ").build();
        Set<ConstraintViolation<ShoppingList>> violations = validator.validate(list);
        return new ConstraintViolationException(violations);
    }

    @Test
    void commitTimeEntityViolationIsA400WithTheResolvedFieldMessage() {
        TransactionSystemException wrapped =
                new TransactionSystemException("Could not commit JPA transaction", blankListViolations());

        ProblemDetail problem = handler().handleEntityValidation(wrapped);

        assertThat(problem.getStatus()).isEqualTo(400);
        assertThat(problem.getProperties()).containsEntry("fieldErrors", Map.of("title", "Title is required."));
    }

    @Test
    void unrelatedTransactionFailureStaysA500() {
        ProblemDetail problem = handler().handleEntityValidation(
                new TransactionSystemException("Could not commit JPA transaction"));

        assertThat(problem.getStatus()).isEqualTo(500);
    }
}
