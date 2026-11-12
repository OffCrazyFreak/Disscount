package disscount.shared.errors;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Comparator;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.BinaryOperator;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/** One broken rule on one field, named by its constraint annotation, such as "NotBlank". */
record FieldViolation(String field, String constraint, String message) {

    private static final Set<String> PRESENCE_CONSTRAINTS = Set.of(
            NotNull.class.getSimpleName(), NotBlank.class.getSimpleName(), NotEmpty.class.getSimpleName());

    // The validator reports a field's violations in no fixed order, so an empty value could read as "too long".
    private static final Comparator<FieldViolation> MOST_BASIC_FIRST = Comparator
            .comparing(FieldViolation::isPresenceRule).reversed()
            .thenComparing(FieldViolation::constraint, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(FieldViolation::message, Comparator.nullsLast(Comparator.naturalOrder()));

    /** The response shows one message per field, so each field keeps its most basic violation. */
    static Map<String, String> mostBasicPerField(Stream<FieldViolation> violations) {
        Map<String, FieldViolation> chosen = violations.collect(Collectors.toMap(
                FieldViolation::field,
                violation -> violation,
                BinaryOperator.minBy(MOST_BASIC_FIRST),
                TreeMap::new));

        Map<String, String> messages = new TreeMap<>();
        chosen.forEach((field, violation) -> messages.put(field, violation.message()));
        return messages;
    }

    private boolean isPresenceRule() {
        return constraint != null && PRESENCE_CONSTRAINTS.contains(constraint);
    }
}
