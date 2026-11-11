package disscount.shoppinglist;

/** A separate enum so OWNER is not expressible on the wire: Jackson rejects it before any service code runs. */
enum LinkAccess {

    NONE,
    VIEW,
    SHOP,
    EDIT;

    public ListAccess toListAccess() {
        return ListAccess.valueOf(name());
    }
}
