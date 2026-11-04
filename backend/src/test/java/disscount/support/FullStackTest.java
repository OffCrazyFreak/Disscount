package disscount.support;

import disscount.digitalCard.service.FakePhotoStore;
import disscount.digitalCard.storage.PhotoStore;
import disscount.productImage.FakeProductImageStore;
import disscount.productImage.FakeProductOriginalStore;
import disscount.productImage.off.OpenFoodFactsClient;
import disscount.productImage.storage.ProductImageStore;
import disscount.productImage.storage.ProductOriginalStore;
import disscount.user.dao.AuthIdentityDao;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.user.domain.enums.AccountType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

/**
 * The whole application on H2 behind MockMvc, shared by the behaviour pinning tests so they
 * run in one cached context and never list the services a slice would have to import. Every
 * test makes its own users, so leftovers from other tests never change an answer.
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class FullStackTest {

    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper json;
    @Autowired protected UserRepository users;

    // The better-auth tables are not in H2, so this native SQL cannot run here.
    @MockitoBean protected AuthIdentityDao authIdentityDao;
    // Never reach the network from a test.
    @MockitoBean protected OpenFoodFactsClient openFoodFacts;

    @TestBean(methodName = "disscount.support.FullStackTest#fakePhotoStore")
    protected PhotoStore photoStore;
    @TestBean(methodName = "disscount.support.FullStackTest#fakeProductImageStore")
    protected ProductImageStore productImageStore;
    @TestBean(methodName = "disscount.support.FullStackTest#fakeProductOriginalStore")
    protected ProductOriginalStore productOriginalStore;

    static PhotoStore fakePhotoStore() {
        return new FakePhotoStore();
    }

    static ProductImageStore fakeProductImageStore() {
        return new FakeProductImageStore();
    }

    static ProductOriginalStore fakeProductOriginalStore() {
        return new FakeProductOriginalStore();
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
