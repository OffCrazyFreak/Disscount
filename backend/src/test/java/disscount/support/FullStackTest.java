package disscount.support;

import disscount.productimage.openfoodfacts.OpenFoodFactsClient;
import disscount.shared.FakePhotoStore;
import disscount.shared.PhotoStore;
import disscount.shared.PhotoStoreConfig;
import disscount.user.AccountType;
import disscount.user.AuthIdentityDao;
import disscount.user.User;
import disscount.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityManager;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

/** One cached context, so tests never list a slice's services; each test makes its own users, so leftovers are safe. */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class FullStackTest {

    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper json;
    @Autowired protected UserRepository users;
    @Autowired protected EntityManager entityManager;

    // The better-auth tables are not in H2, so this native SQL cannot run here.
    @MockitoBean protected AuthIdentityDao authIdentityDao;
    // Never reach the network from a test.
    @MockitoBean protected OpenFoodFactsClient openFoodFacts;

    @TestBean(name = PhotoStoreConfig.CARD_PHOTOS, methodName = "disscount.support.FullStackTest#fakePhotoStore")
    protected PhotoStore photoStore;
    @TestBean(name = PhotoStoreConfig.PRODUCT_PHOTOS, methodName = "disscount.support.FullStackTest#fakeProductImageStore")
    protected PhotoStore productImageStore;
    @TestBean(name = PhotoStoreConfig.PRODUCT_ORIGINALS, methodName = "disscount.support.FullStackTest#fakeProductOriginalStore")
    protected PhotoStore productOriginalStore;

    static PhotoStore fakePhotoStore() {
        return new FakePhotoStore();
    }

    static PhotoStore fakeProductImageStore() {
        return new FakePhotoStore();
    }

    static PhotoStore fakeProductOriginalStore() {
        return new FakePhotoStore();
    }

    protected User newUser(String name) {
        return newUser(name, AccountType.CONSUMER);
    }

    protected User newAdmin() {
        return newUser("admin", AccountType.ADMIN);
    }

    protected User newUser(String name, AccountType accountType) {
        UUID id = UUID.randomUUID();
        return users.save(User.builder().id(id).username(name + "-" + id).accountType(accountType).build());
    }

    /** An ordinary session token. It carries no email claim, so provisioning leaves the stored profile as it is. */
    protected static RequestPostProcessor as(User user) {
        return jwt().jwt(j -> j.subject(user.getId().toString()));
    }

    protected JsonNode body(org.springframework.test.web.servlet.ResultActions result) throws Exception {
        return json.readTree(result.andReturn().getResponse().getContentAsString());
    }

    protected static Set<String> fieldNames(JsonNode node) {
        return new TreeSet<>(node.propertyNames());
    }
}
