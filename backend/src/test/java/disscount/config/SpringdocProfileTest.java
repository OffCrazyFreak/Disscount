package disscount.config;

import disscount.productimage.openfoodfacts.OpenFoodFactsClient;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Boots from main's resources, because the test application.properties replaces main's and keeps springdoc on.
 * Only the variables production sets and an H2 database are filled in here.
 */
class SpringdocProfileTest {

    private static final String SWAGGER_UI = "/swagger-ui/index.html";

    @SpringBootTest(properties = {
            "spring.config.location=file:src/main/resources/",
            "SPRING_DATASOURCE_URL=jdbc:h2:mem:springdoc;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
            "SPRING_DATASOURCE_USERNAME=sa",
            "SPRING_DATASOURCE_PASSWORD=",
            "spring.datasource.driver-class-name=org.h2.Driver",
            "spring.datasource.hikari.data-source-properties.logServerErrorDetail=",
            "spring.jpa.hibernate.ddl-auto=create-drop",
            "BETTER_AUTH_JWKS_URI=http://localhost:3000/api/auth/jwks",
            "BETTER_AUTH_ISSUER=http://localhost:3000",
            "product-images.jobs.enabled=false"
    })
    @AutoConfigureMockMvc
    abstract static class MainConfiguration {

        @Autowired MockMvc mvc;

        // Never reach the network from a test.
        @MockitoBean OpenFoodFactsClient openFoodFacts;
    }

    @Nested
    class WithoutTheLocalProfile extends MainConfiguration {

        @Test
        void theApiDescriptionIsNotServed() throws Exception {
            mvc.perform(get("/v3/api-docs")).andExpect(status().isNotFound());
        }

        @Test
        void swaggerUiIsNotServed() throws Exception {
            mvc.perform(get("/api-docs")).andExpect(status().isNotFound());
            mvc.perform(get(SWAGGER_UI)).andExpect(status().isNotFound());
        }
    }

    @Nested
    @ActiveProfiles("local")
    class WithTheLocalProfile extends MainConfiguration {

        @Test
        void theApiDescriptionIsServed() throws Exception {
            mvc.perform(get("/v3/api-docs")).andExpect(status().isOk());
        }

        @Test
        void swaggerUiIsServed() throws Exception {
            mvc.perform(get("/api-docs")).andExpect(status().is3xxRedirection());
            mvc.perform(get(SWAGGER_UI)).andExpect(status().isOk());
        }
    }
}
