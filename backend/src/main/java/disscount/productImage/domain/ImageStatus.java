package disscount.productImage.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

public enum ImageStatus {
    /** Known on Open Food Facts but not copied into our bucket yet. */
    CANDIDATE,
    /** A user photo nobody else has confirmed; shown only when it is the main photo. */
    PENDING,
    VERIFIED,
    HIDDEN;

    // Since Hibernate 7 a fresh database still gets a CHECK on these values (product_image_status_check) despite the converter.
    // ddl-auto=update never refreshes it, so until Flyway lands a new value needs that constraint updated by hand.
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
