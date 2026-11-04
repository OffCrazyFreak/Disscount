package disscount.config;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import disscount.digitalCard.dto.CardUsedEntry;
import disscount.digitalCard.dto.DigitalCardDto;
import disscount.shoppingList.dto.ShoppingListCopyRequest;
import disscount.user.dto.UserDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** The frontend's parseServerDate reads zone-less timestamps as UTC, so a shape change here silently shifts every time it shows. */
@SpringBootTest
@AutoConfigureMockMvc
class JsonWireFormatTest {

    @Autowired ObjectMapper json;

    @Test
    void zoneLessTimestampsAreIsoStringsWithoutAnOffset() throws Exception {
        JsonNode user = json.valueToTree(UserDto.builder()
                .createdAt(LocalDateTime.of(2026, 3, 1, 10, 15, 30))
                .onboardingCompletedAt(LocalDateTime.of(2026, 3, 1, 10, 15, 30, 123_456_000))
                .build());

        assertThat(user.get("createdAt").asString()).isEqualTo("2026-03-01T10:15:30");
        assertThat(user.get("onboardingCompletedAt").asString()).isEqualTo("2026-03-01T10:15:30.123456");
    }

    @Test
    void instantsAreIsoStringsInUtc() throws Exception {
        JsonNode user = json.valueToTree(UserDto.builder()
                .lastActiveAt(Instant.parse("2026-03-01T10:15:30Z"))
                .lastLoginAt(Instant.parse("2026-03-01T10:15:30.5Z"))
                .build());

        assertThat(user.get("lastActiveAt").asString()).isEqualTo("2026-03-01T10:15:30Z");
        assertThat(user.get("lastLoginAt").asString()).isEqualTo("2026-03-01T10:15:30.500Z");
    }

    @Test
    void datesAreIsoStringsAndNullFieldsStayInTheBody() throws Exception {
        JsonNode card = json.valueToTree(DigitalCardDto.builder()
                .validFrom(LocalDate.of(2026, 3, 1))
                .build());

        assertThat(card.get("validFrom").asString()).isEqualTo("2026-03-01");
        assertThat(card.has("expiresOn")).isTrue();
        assertThat(card.get("expiresOn").isNull()).isTrue();
    }

    @Test
    void incomingInstantsAcceptAnOffsetAndUnknownFieldsAreIgnored() throws Exception {
        CardUsedEntry entry = json.readValue(
                "{\"id\":\"8d2c1f0e-3a4b-4c5d-9e6f-7a8b9c0d1e2f\",\"usedAt\":\"2026-03-01T12:15:30+02:00\",\"extra\":1}",
                CardUsedEntry.class);

        assertThat(entry.getUsedAt()).isEqualTo(Instant.parse("2026-03-01T10:15:30Z"));
    }

    // Jackson 3 rejects a null for a primitive where Jackson 2 read it as false; the frontend always sends booleans.
    @Test
    void aNullForAPrimitiveIsRejectedButAMissingOneDefaults() throws Exception {
        assertThatThrownBy(() -> json.readValue("{\"title\":\"Kopija\",\"includeItems\":null}", ShoppingListCopyRequest.class))
                .isInstanceOf(JacksonException.class);

        assertThat(json.readValue("{\"title\":\"Kopija\"}", ShoppingListCopyRequest.class).isIncludeItems()).isFalse();
    }
}
