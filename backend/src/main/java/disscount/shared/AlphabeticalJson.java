package disscount.shared;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Writes a record's JSON keys in alphabetical order. Jackson 3 sorts a plain class's keys but keeps a record's
 * declaration order, so a DTO that became a record keeps the bytes clients got before (OpenAPI order is unaffected).
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface AlphabeticalJson {
}
