package disscount.security;

import disscount.contact.ContactMessage;
import disscount.contact.ContactMessageRepository;
import disscount.productimage.ImageSource;
import disscount.productimage.ImageStatus;
import disscount.productimage.ProductImage;
import disscount.productimage.ProductImageRepository;
import disscount.shared.TestImages;
import disscount.support.FullStackTest;
import disscount.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.Arrays;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Through the URL rule in SecurityConfig: 401 without a token, 403 to a consumer, 2xx to an admin. */
class AdminGatingTest extends FullStackTest {

    enum Route {
        LIST_USERS("GET", "/api/admin/users", null),
        UPDATE_ACCOUNT_TYPE("PATCH", "/api/admin/users/{user}", "{\"accountType\":\"ENTERPRISE\"}"),
        DELETE_USER("DELETE", "/api/admin/users/{user}", null),
        LIST_CONTACT("GET", "/api/admin/contact", null),
        GET_CONTACT("GET", "/api/admin/contact/{message}", null),
        MARK_CONTACT_READ("PATCH", "/api/admin/contact/{message}/read", null),
        MARK_CONTACT_UNREAD("PATCH", "/api/admin/contact/{message}/unread", null),
        DELETE_CONTACT("DELETE", "/api/admin/contact/{message}", null),
        RESTORE_CONTACT("PATCH", "/api/admin/contact/{message}/restore", null),
        PHOTO_QUEUE("GET", "/api/admin/product-images/queue", null),
        PRODUCT_PHOTOS("GET", "/api/admin/product-images/{ean}", null),
        REFRESH_FROM_OFF("POST", "/api/admin/product-images/{ean}/refresh", null),
        SET_MAIN_PHOTO("PUT", "/api/admin/product-images/{ean}/main", "{\"imageId\":\"{image}\"}"),
        MARK_REVIEWED("POST", "/api/admin/product-images/{ean}/reviewed", null),
        SET_PHOTO_STATUS("PUT", "/api/admin/product-images/images/{image}/status", "{\"status\":\"VERIFIED\"}"),
        CROP_PHOTO("PUT", "/api/admin/product-images/images/{image}/crop", "{\"rotation\":90,\"crop\":null}"),
        PHOTO_ORIGINAL("GET", "/api/admin/product-images/images/{image}/original", null),
        DELETE_PHOTO("DELETE", "/api/admin/product-images/images/{image}", null),
        PHOTO_CONTRIBUTORS("GET", "/api/admin/product-images/contributors", null);

        final String method;
        final String path;
        final String body;

        Route(String method, String path, String body) {
            this.method = method;
            this.path = path;
            this.body = body;
        }
    }

    @Autowired @Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping handlerMapping;
    @Autowired ContactMessageRepository contactMessages;
    @Autowired ProductImageRepository productImages;

    private User admin;
    private User consumer;
    private User target;
    private UUID messageId;
    private String ean;
    private UUID imageId;

    @BeforeEach
    void setUp() {
        admin = newAdmin();
        consumer = newUser("consumer");
        target = newUser("target");
        messageId = contactMessages.save(ContactMessage.builder().subject("Pitanje").message("Poruka").build()).getId();

        ean = String.valueOf(ThreadLocalRandom.current().nextLong(1_000_000_000_000L, 9_999_999_999_999L));
        String originalKey = "originals/" + ean + ".jpg";
        productOriginalStore.put(originalKey, TestImages.jpeg(64, 48), "image/jpeg");
        imageId = productImages.save(ProductImage.builder()
                .ean(ean).source(ImageSource.USER).status(ImageStatus.VERIFIED).originalKey(originalKey)
                .fullKey("products/" + ean + "/full.jpg").thumbKey("products/" + ean + "/thumb.jpg").build()).getId();
    }

    private MockHttpServletRequestBuilder call(Route route) {
        String path = route.path
                .replace("{user}", target.getId().toString())
                .replace("{message}", messageId.toString())
                .replace("{ean}", ean)
                .replace("{image}", imageId.toString());
        MockHttpServletRequestBuilder request = request(HttpMethod.valueOf(route.method), path);
        if (route.body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(route.body.replace("{image}", imageId.toString()));
        }
        return request;
    }

    @ParameterizedTest
    @EnumSource(Route.class)
    void anAnonymousCallerIs401(Route route) throws Exception {
        mvc.perform(call(route)).andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @EnumSource(Route.class)
    void aSignedInConsumerIs403(Route route) throws Exception {
        mvc.perform(call(route).with(as(consumer))).andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @EnumSource(Route.class)
    void anAdminIsLetThrough(Route route) throws Exception {
        mvc.perform(call(route).with(as(admin))).andExpect(status().is2xxSuccessful());
    }

    // The admin check runs before the lookup, so a consumer cannot tell a real message id from an unknown one.
    @ParameterizedTest
    @EnumSource(value = Route.class, names = {"GET_CONTACT", "MARK_CONTACT_READ", "MARK_CONTACT_UNREAD", "DELETE_CONTACT", "RESTORE_CONTACT"})
    void anUnknownContactMessageIs404ForAnAdminAnd403ForAConsumer(Route route) throws Exception {
        messageId = UUID.randomUUID();

        mvc.perform(call(route).with(as(admin))).andExpect(status().isNotFound());
        mvc.perform(call(route).with(as(consumer))).andExpect(status().isForbidden());
    }

    // The dashboard lets ENTERPRISE and PUBLIC_SECTOR in; the admin API must not.
    @ParameterizedTest
    @EnumSource(value = disscount.user.AccountType.class, names = "ADMIN", mode = EnumSource.Mode.EXCLUDE)
    void everyNonAdminAccountTypeIs403(disscount.user.AccountType accountType) throws Exception {
        User caller = newUser("caller", accountType);

        for (Route route : Route.values()) {
            mvc.perform(call(route).with(as(caller))).andExpect(status().isForbidden());
        }
    }

    @Test
    void aDeletedAdminIs403() throws Exception {
        admin.setDeletedAt(java.time.LocalDateTime.now());
        users.save(admin);

        mvc.perform(call(Route.LIST_USERS).with(as(admin))).andExpect(status().isForbidden());
    }

    @Test
    void anAdminsPurposeScopedTokenIs403() throws Exception {
        mvc.perform(call(Route.LIST_USERS).with(jwt().jwt(j -> j
                        .subject(admin.getId().toString())
                        .claim("purpose", "account-erasure"))))
                .andExpect(status().isForbidden());
    }

    // A new admin endpoint must join the table above, or it ships with no proof it is gated.
    @Test
    void theTableCoversEveryAdminRoute() {
        Set<String> mapped = handlerMapping.getHandlerMethods().keySet().stream()
                .flatMap(info -> info.getPatternValues().stream()
                        .flatMap(pattern -> info.getMethodsCondition().getMethods().stream()
                                .map(method -> method + " " + pattern)))
                .filter(route -> route.contains(" /api/admin"))
                .collect(Collectors.toCollection(TreeSet::new));

        Set<String> covered = Arrays.stream(Route.values())
                .map(route -> route.method + " " + route.path)
                .collect(Collectors.toCollection(TreeSet::new));

        assertThat(normalise(covered)).isEqualTo(normalise(mapped));
    }

    // Path variable names differ between the table and the controllers; only their positions matter.
    private static Set<String> normalise(Set<String> routes) {
        return routes.stream().map(route -> route.replaceAll("\\{[^}]+}", "{}"))
                .collect(Collectors.toCollection(TreeSet::new));
    }
}
