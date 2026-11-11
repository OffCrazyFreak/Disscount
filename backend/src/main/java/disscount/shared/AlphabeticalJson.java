package disscount.shared;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Writes a record's JSON keys in alphabetical order, for DTOs that were Lombok classes without a public all-args
 * constructor: Jackson 3 wrote those alphabetically, but writes a record (like a class with such a constructor) in
 * declaration order. OpenAPI order is unaffected, as springdoc reads declaration order through its own Jackson 2.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface AlphabeticalJson {
}
