package disscount.digitalCard.dto;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/** PostgreSQL cannot store a NUL in text, so it would surface as a 500 instead of a form error. */
@Documented
@Constraint(validatedBy = NoNulValidator.class)
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface NoNul {

    String message() default "Tekst sadrži nedopušten znak";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
