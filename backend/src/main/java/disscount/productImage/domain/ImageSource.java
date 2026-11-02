package disscount.productImage.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

public enum ImageSource {
    OPEN_FOOD_FACTS,
    USER,
    ADMIN;

    // Stored as text for the same reason as ImageStatus.
    @Converter
    public static class Column implements AttributeConverter<ImageSource, String> {
        @Override
        public String convertToDatabaseColumn(ImageSource source) {
            return source == null ? null : source.name();
        }

        @Override
        public ImageSource convertToEntityAttribute(String value) {
            return value == null ? null : ImageSource.valueOf(value);
        }
    }
}
