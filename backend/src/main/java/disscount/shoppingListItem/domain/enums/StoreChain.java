package disscount.shoppingListItem.domain.enums;

public enum StoreChain {
    PLODINE("plodine"),
    TOMMY("tommy"),
    KONZUM("konzum"),
    LIDL("lidl"),
    STUDENAC("studenac"),
    SPAR("spar"),
    KAUFLAND("kaufland"),
    METRO("metro"),
    EUROSPIN("eurospin"),
    JADRANKA_TRGOVINA("jadranka_trgovina"),
    DM("dm"),
    KTC("ktc"),
    TRGOCENTAR("trgocentar"),
    VRUTAK("vrutak"),
    ZABAC("zabac"),
    NTL("ntl"),
    RIBOLA("ribola"),
    ROTO("roto"),
    BOSO("boso"),
    BRODOKOMERC("brodokomerc"),
    TRGOVINA_KRK("trgovina-krk"),
    LORENCO("lorenco");

    private final String code;

    StoreChain(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
