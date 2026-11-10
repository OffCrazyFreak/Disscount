package disscount.productimage;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

public enum ImageStatus {
    /** Known on Open Food Facts but not copied into our photo store yet. */
    CANDIDATE,
    /** A user photo nobody else has confirmed; shown only when it is the main photo. */
    PENDING,
    VERIFIED,
    HIDDEN;

    // Hibernate 7 adds product_image_status_check despite the converter; ddl-auto=update skips it: edit by hand.
    @Converter
    public static class Column implements AttributeConverter<ImageStatus, String> {
        @Override
        public String convertToDatabaseColumn(ImageStatus status) {
            return status == null ? null : status.name();
        }

        @Override
        public ImageStatus convertToEntityAttribute(String value) {
            return value == null ? null : ImageStatus.valueOf(value);
        }
    }
}
