package disscount.productimage;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Why a photo is HIDDEN; a hidden row with no reason predates this column and counts as an admin decision. */
enum HiddenReason {
    /** The render job could not copy it; a new Open Food Facts revision gives it another try. */
    JOB_SKIPPED,
    /** An admin rejected it, which nothing automatic may undo. */
    ADMIN;

    // Stored as text for the same reason as ImageStatus: ddl-auto=update keeps an enum column's CHECK constraint.
    @Converter
    public static class Column implements AttributeConverter<HiddenReason, String> {
        @Override
        public String convertToDatabaseColumn(HiddenReason reason) {
            return reason == null ? null : reason.name();
        }

        @Override
        public HiddenReason convertToEntityAttribute(String value) {
            return value == null ? null : HiddenReason.valueOf(value);
        }
    }
}
