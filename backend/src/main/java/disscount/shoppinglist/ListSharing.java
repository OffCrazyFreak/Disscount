package disscount.shoppinglist;

import java.util.UUID;

/** The two columns access is decided on, read without loading the list into the persistence context. */
record ListSharing(UUID ownerId, ListAccess linkAccess) {

    ListAccess resolvedLinkAccess() {
        return linkAccess != null ? linkAccess : ListAccess.NONE;
    }
}
