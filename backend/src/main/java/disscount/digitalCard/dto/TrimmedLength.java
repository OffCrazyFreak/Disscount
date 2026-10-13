package disscount.digitalCard.dto;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/** Length of the value after trimming, which is what gets stored, so the rule reports on the right field. */
@Documented
@Constraint(validatedBy = TrimmedLengthValidator.class)
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface TrimmedLength {

    int min() default 0;

    int max() default Integer.MAX_VALUE;

    String message();

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
