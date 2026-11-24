package disscount.storename;

record StoreNameSuggestionDto(String name) {

    static StoreNameSuggestionDto from(StoreNameSuggestion suggestion) {
        return new StoreNameSuggestionDto(suggestion.getName());
    }
}
