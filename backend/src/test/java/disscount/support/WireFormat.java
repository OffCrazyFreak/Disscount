package disscount.support;

/**
 * The value shapes the frontend's zod schemas and parseServerDate accept. Zone-less
 * timestamps carry no offset and are read as UTC; instants end in Z.
 */
public final class WireFormat {

    public static final String UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
    public static final String LOCAL_DATE_TIME = "\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,9})?";
    public static final String INSTANT = LOCAL_DATE_TIME + "Z";
    public static final String DATE = "\\d{4}-\\d{2}-\\d{2}";

    private WireFormat() {}
}
