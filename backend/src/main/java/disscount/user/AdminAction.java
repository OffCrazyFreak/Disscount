package disscount.user;

/** Stored by name in app.admin_audit; a new value needs a migration that widens ck_admin_audit_action. */
public enum AdminAction {
    DELETE_USER,
    PROMOTE_TO_ADMIN,
    DEMOTE_FROM_ADMIN,
    READ_USER_LIST,
    READ_CONTACT_LIST,
    READ_CONTACT_MESSAGE,
    MARK_CONTACT_MESSAGE_READ,
    MARK_CONTACT_MESSAGE_UNREAD,
    DELETE_CONTACT_MESSAGE,
    RESTORE_CONTACT_MESSAGE,
    // Reserved for the admin audit view, which records its own opening once it exists.
    READ_AUDIT
}
