package disscount.user.domain.enums;

// How a user first heard about Disscount. Kept granular (per social platform)
// so marketing spend can be attributed to the specific channel that converts.
public enum AcquisitionChannel {
    GOOGLE_SEARCH,
    INSTAGRAM,
    FACEBOOK,
    TIKTOK,
    YOUTUBE,
    FRIEND_OR_FAMILY,
    ONLINE_AD,
    BLOG_OR_NEWS,
    APP_STORE,
    POSTER_OR_FLYER,
    EVENT,
    OTHER
}
