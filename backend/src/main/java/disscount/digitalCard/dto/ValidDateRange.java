package disscount.digitalCard.dto;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ValidDateRangeValidator.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidDateRange {

    String message() default "{validation.card.dateRange.invalid}";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
