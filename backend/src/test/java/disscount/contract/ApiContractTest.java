package disscount.contract;

import disscount.digitalCard.service.DigitalCardPhotoService;
import disscount.support.ApiContract;
import disscount.support.FullStackTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.AnnotatedBeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AssignableTypeFilter;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.cfg.JsonNodeFeature;
import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

import java.nio.file.Files;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Fails when contracts/backend-api.json no longer describes this backend. The frontend's
 * backend-contract test holds the zod schemas to the same file, so a change on either side
 * fails CI until both agree. See docs/API-CONTRACT.md.
 */
class ApiContractTest extends FullStackTest {

    private static final String REFRESH = "cd backend && mvn -B test -Dtest=ApiContractTest -Dcontract.update=true";

    private static final JsonMapper WRITER = JsonMapper.builder()
            .enable(SerializationFeature.INDENT_OUTPUT)
            .enable(JsonNodeFeature.WRITE_PROPERTIES_SORTED)
            .build();

    @Test
    void theCommittedContractDescribesThisBackend() throws Exception {
        ObjectNode current = json.createObjectNode();
        current.set("schemas", body(mvc.perform(get("/v3/api-docs")).andExpect(status().isOk())).at("/components/schemas"));
        current.set("enums", json.valueToTree(enums()));

        if (Boolean.getBoolean("contract.update")) {
            Files.writeString(ApiContract.FILE, WRITER.writeValueAsString(current) + "\n");
            return;
        }

        JsonNode committed = ApiContract.committed();
        assertThat(committed).as("%s is stale; refresh it with: %s", ApiContract.FILE, REFRESH).isEqualTo(current);
    }

    @Test
    void theWireCheckRejectsANullTheContractDoesNotDeclare() {
        ObjectNode card = json.createObjectNode().put("slot", "icon").putNull("sha256");

        assertThatThrownBy(() -> ApiContract.assertMatches("CardPhotoDto", card))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("CardPhotoDto.sha256");
    }

    @Test
    void theWireCheckFollowsNestedDtosAndAcceptsADeclaredNull() {
        ObjectNode product = json.createObjectNode();
        ApiContract.committed().at("/schemas/AdminProductDto/properties").propertyNames().forEach(product::putNull);

        assertThatThrownBy(() -> ApiContract.assertMatches("AdminProductDto", product))
                .hasMessageContaining("AdminProductDto.ean")
                .hasMessageNotContaining("AdminProductDto.reviewedAt");
    }

    // Scanned, not listed, so a new enum reaches the contract without anyone remembering it.
    private static Map<String, Collection<String>> enums() throws Exception {
        var scanner = new ClassPathScanningCandidateComponentProvider(false) {
            @Override
            protected boolean isCandidateComponent(AnnotatedBeanDefinition definition) {
                return true;
            }
        };
        scanner.addIncludeFilter(new AssignableTypeFilter(Enum.class));

        Map<String, Collection<String>> enums = new TreeMap<>();
        for (var definition : scanner.findCandidateComponents("disscount")) {
            Class<?> type = Class.forName(definition.getBeanClassName());
            // An enum constant with a body is its own class, and test enums never reach the wire.
            if (!type.isEnum() || type.getProtectionDomain().getCodeSource().getLocation().getPath().contains("test-classes")) {
                continue;
            }
            List<String> values = Arrays.stream(type.getEnumConstants()).map(value -> ((Enum<?>) value).name()).sorted().toList();
            assertThat(enums.put(type.getSimpleName(), values)).as("two enums named %s", type.getSimpleName()).isNull();
        }
        // Stored as a plain string, but it is an enum to everything that reads it.
        enums.put("CardPhotoSlot", DigitalCardPhotoService.SLOTS.stream().sorted().toList());
        return enums;
    }
}
