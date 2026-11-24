package disscount.shared;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CurrentUserArgumentResolverTest {

    private final CurrentUserArgumentResolver resolver = new CurrentUserArgumentResolver();

    @SuppressWarnings("unused")
    static class Handlers {
        void required(@CurrentUser UUID userId) {}
        void optional(@CurrentUser(required = false) UUID callerId) {}
        void wrongType(@CurrentUser String userId) {}
        void unannotated(UUID id) {}
    }

    private static MethodParameter parameterOf(String method, Class<?> type) throws NoSuchMethodException {
        return new MethodParameter(Handlers.class.getDeclaredMethod(method, type), 0);
    }

    private static void signIn(Object principal) {
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(principal, null));
    }

    private Object resolve(MethodParameter parameter) {
        return resolver.resolveArgument(parameter, null, null, null);
    }

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void theTokenSubjectBecomesTheParameter() throws Exception {
        UUID userId = UUID.randomUUID();
        signIn(userId.toString());

        assertThat(resolve(parameterOf("required", UUID.class))).isEqualTo(userId);
        assertThat(resolve(parameterOf("optional", UUID.class))).isEqualTo(userId);
    }

    @Test
    void anAnonymousCallerIsNullWhereOptional() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken(
                "key", "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")));

        assertThat(resolve(parameterOf("optional", UUID.class))).isNull();
    }

    @Test
    void aSubjectThatIsNotAUserIdIsNullWhereOptional() throws Exception {
        signIn("not-a-uuid");

        assertThat(resolve(parameterOf("optional", UUID.class))).isNull();
    }

    @Test
    void aRequiredParameterWithNoCallerIsAServerBug() throws Exception {
        MethodParameter required = parameterOf("required", UUID.class);

        assertThatThrownBy(() -> resolve(required)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void onlyAnnotatedUuidParametersAreResolved() throws Exception {
        assertThat(resolver.supportsParameter(parameterOf("unannotated", UUID.class))).isFalse();

        MethodParameter wrongType = parameterOf("wrongType", String.class);
        assertThatThrownBy(() -> resolver.supportsParameter(wrongType)).isInstanceOf(IllegalStateException.class);
    }
}
