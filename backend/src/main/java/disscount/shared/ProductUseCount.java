package disscount.shared;

/** How many people keep one EAN on their lists, counted by the feature that owns the lists. */
public record ProductUseCount(String ean, long people) {}
