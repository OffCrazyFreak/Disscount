package disscount.digitalcard;

import disscount.user.User;

import java.math.BigDecimal;
import java.util.UUID;

public final class CardServiceTestSupport {

    private CardServiceTestSupport() {}

    public static User user() {
        return User.builder().id(UUID.randomUUID()).build();
    }

    public static DigitalCardRequest request(String cardName) {
        return DigitalCardRequest.builder()
                .cardName(cardName)
                .cardType("loyalty")
                .storeName("Konzum")
                .chainCode("konzum")
                .codeValue("3850123456789")
                .codeType("ean_13")
                .cardColor("#D50000")
                .balance(new BigDecimal("12.5"))
                .balanceUnit("EUR")
                .build();
    }
}
