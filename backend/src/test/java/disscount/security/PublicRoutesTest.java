package disscount.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;

import static org.assertj.core.api.Assertions.assertThat;

/** The API docs mark operations public from these answers, so they must match what the request matchers open. */
class PublicRoutesTest {

    @Test
    void aWildcardMatchesAVariableOrALiteralSegment() {
        assertThat(PublicRoutes.isPublic(HttpMethod.GET, "/api/products/{ean}/images")).isTrue();
        assertThat(PublicRoutes.isPublic(HttpMethod.GET, "/api/products/any-literal/images")).isTrue();
    }

    @Test
    void aSharedListVariableMatchesOnlyAVariableBecauseRequestsNeedAUuid() {
        assertThat(PublicRoutes.isPublic(HttpMethod.GET, "/api/shopping-lists/{id}")).isTrue();
        assertThat(PublicRoutes.isPublic(HttpMethod.PUT, "/api/shopping-lists/{listId}/items/{itemId}")).isTrue();
        assertThat(PublicRoutes.isPublic(HttpMethod.GET, "/api/shopping-lists/me")).isFalse();
        assertThat(PublicRoutes.isPublic(HttpMethod.GET, "/api/shopping-lists/items")).isFalse();
    }

    @Test
    void theMethodMustMatchToo() {
        assertThat(PublicRoutes.isPublic(HttpMethod.POST, "/api/products/{ean}/images")).isFalse();
        assertThat(PublicRoutes.isPublic(HttpMethod.GET, "/api/contact")).isFalse();
        assertThat(PublicRoutes.isPublic(HttpMethod.PATCH, "/api/shopping-lists/{id}")).isFalse();
    }
}
