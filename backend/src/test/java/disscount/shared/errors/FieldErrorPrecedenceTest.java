package disscount.shared.errors;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.StaticMessageSource;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.ServletWebRequest;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** A field breaking two rules must always answer the same message, whatever order the validator reports them in. */
class FieldErrorPrecedenceTest {

    private static final String REQUIRED = "Name is required.";
    private static final String TOO_LONG = "Name is too long.";

    record NamedRequest(
            @NotBlank(message = REQUIRED)
            @Size(min = 1, max = 255, message = TOO_LONG)
            String name) {
    }

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @AfterEach
    void resetLocale() {
        LocaleContextHolder.resetLocaleContext();
    }

    private GlobalExceptionHandler handler() {
        StaticMessageSource messages = new StaticMessageSource();
        messages.setUseCodeAsDefaultMessage(true);
        LocaleContextHolder.setLocale(Locale.ENGLISH);
        return new GlobalExceptionHandler(messages);
    }

    @Test
    void anEmptyEntityValueAnswersRequiredInEitherReportOrder() {
        List<ConstraintViolation<NamedRequest>> violations = new ArrayList<>(validator.validate(new NamedRequest("")));
        assertThat(violations).hasSize(2);

        Comparator<ConstraintViolation<NamedRequest>> byMessage = Comparator.comparing(ConstraintViolation::getMessage);

        for (Comparator<ConstraintViolation<NamedRequest>> order : List.of(byMessage, byMessage.reversed())) {
            violations.sort(order);
            ProblemDetail problem = handler().handleEntityValidation(
                    new ConstraintViolationException(new LinkedHashSet<>(violations)));

            assertThat(problem.getProperties()).containsEntry("fieldErrors", Map.of("name", REQUIRED));
        }
    }

    @Test
    void anEmptyRequestBodyValueAnswersRequiredInEitherReportOrder() throws Exception {
        FieldError required = fieldError("NotBlank", REQUIRED);
        FieldError tooLong = fieldError("Size", TOO_LONG);

        for (List<FieldError> order : List.of(List.of(required, tooLong), List.of(tooLong, required))) {
            BeanPropertyBindingResult result = new BeanPropertyBindingResult(new NamedRequest(""), "namedRequest");
            order.forEach(result::addError);

            ResponseEntity<Object> response = handler().handleMethodArgumentNotValid(
                    new MethodArgumentNotValidException(bodyParameter(), result),
                    new HttpHeaders(),
                    HttpStatus.BAD_REQUEST,
                    new ServletWebRequest(new MockHttpServletRequest(), new MockHttpServletResponse()));

            ProblemDetail problem = (ProblemDetail) response.getBody();
            assertThat(problem).isNotNull();
            assertThat(problem.getProperties()).containsEntry("fieldErrors", Map.of("name", REQUIRED));
        }
    }

    private static FieldError fieldError(String constraint, String message) {
        return new FieldError("namedRequest", "name", "", false, new String[] {constraint}, null, message);
    }

    private static MethodParameter bodyParameter() throws NoSuchMethodException {
        return new MethodParameter(FieldErrorPrecedenceTest.class.getDeclaredMethod("accept", NamedRequest.class), 0);
    }

    @SuppressWarnings("unused")
    private static void accept(NamedRequest request) {
    }
}
