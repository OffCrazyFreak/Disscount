package disscount.digitalcard;

record CardPhotoDto(String slot, String sha256) {

    static CardPhotoDto from(DigitalCardPhoto photo) {
        return new CardPhotoDto(photo.getSlot(), photo.getSha256());
    }
}
