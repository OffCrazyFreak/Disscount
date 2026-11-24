package disscount.shared;

import io.swagger.v3.oas.annotations.Parameter;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** The caller's user id, the bearer token's subject, on a {@code UUID} controller parameter. */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Parameter(hidden = true)
public @interface CurrentUser {

    /** False on routes an anonymous caller may reach, where the parameter is then null. */
    boolean required() default true;
}
