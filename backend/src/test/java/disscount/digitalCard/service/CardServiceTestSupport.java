package disscount.digitalCard.service;

import disscount.digitalCard.dto.DigitalCardRequest;
import disscount.user.domain.User;

import java.math.BigDecimal;
import java.util.UUID;

public final class CardServiceTestSupport {

    private CardServiceTestSupport() {}

    public static User user() {
        return User.builder().id(UUID.randomUUID()).build();
    }

    public static DigitalCardRequest request(String cardName) {
        DigitalCardRequest r = new DigitalCardRequest();
        r.setCardName(cardName);
        r.setCardType("loyalty");
        r.setStoreName("Konzum");
        r.setChainCode("konzum");
        r.setCodeValue("3850123456789");
        r.setCodeType("ean_13");
        r.setCardColor("#D50000");
        r.setBalance(new BigDecimal("12.5"));
        r.setBalanceUnit("EUR");
        return r;
    }
}
