package disscount.digitalcard.photo;

public record CardPhotoDto(String slot, String sha256) {

    public static CardPhotoDto from(DigitalCardPhoto photo) {
        return new CardPhotoDto(photo.getSlot(), photo.getSha256());
    }
}
