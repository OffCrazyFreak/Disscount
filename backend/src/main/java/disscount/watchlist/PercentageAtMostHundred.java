package disscount.watchlist;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/** On the request type, as the limit depends on watchType; an absolute alert keeps only @Positive. */
@Documented
@Constraint(validatedBy = PercentageAtMostHundredValidator.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@interface PercentageAtMostHundred {

    String message() default "{validation.threshold.percentageMax}";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
