package disscount.productimage;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

public enum ImageSource {
    OPEN_FOOD_FACTS,
    USER,
    ADMIN;

    // Stored as the name; a new value needs a migration that widens ck_product_image_source.
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
