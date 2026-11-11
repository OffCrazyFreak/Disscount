package disscount.security;

import disscount.support.FullStackTest;
import org.junit.jupiter.api.Test;
import org.springframework.aop.framework.Advised;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.core.Ordered;
import org.springframework.security.authorization.method.AuthorizationInterceptorsOrder;
import org.springframework.stereotype.Service;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.Parameter;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/** A by-id method without a guard would still lean on its scoped query alone, which is what #429 R6 ends. */
class OwnershipGuardsTest extends FullStackTest {

    private static final Map<String, String> GUARD_BY_FEATURE = Map.of(
            "disscount.digitalcard", "@digitalCardGuard.",
            "disscount.shoppinglist", "@shoppingListGuard.",
            "disscount.watchlist", "@watchlistGuard.");

    /** The caller's own id, which the guard checks the resource against, is not a resource id. */
    private static final Set<String> CALLER_PARAMETERS = Set.of("userId", "ownerId");

    @Autowired ApplicationContext context;

    @Test
    void everyByIdMethodOfAnOwnerScopedServiceNamesItsFeaturesGuard() {
        List<String> guarded = ownerScopedServices()
                .flatMap(service -> byIdMethods(AopUtils.getTargetClass(service)))
                .peek(method -> assertThat(guardExpression(method))
                        .as(method.toString())
                        .startsWith(GUARD_BY_FEATURE.get(method.getDeclaringClass().getPackageName())))
                .map(method -> method.getDeclaringClass().getSimpleName() + "." + method.getName())
                .sorted()
                .toList();

        assertThat(guarded).containsExactly(
                "DigitalCardPhotoService.currentSha256",
                "DigitalCardPhotoService.delete",
                "DigitalCardPhotoService.open",
                "DigitalCardPhotoService.upload",
                "DigitalCardService.delete",
                "DigitalCardService.get",
                "DigitalCardService.setArchived",
                "DigitalCardService.setPinned",
                "DigitalCardService.upsert",
                "ShoppingListCopyService.copy",
                "ShoppingListItemService.addItemToShoppingList",
                "ShoppingListItemService.deleteShoppingListItem",
                "ShoppingListItemService.updateShoppingListItem",
                "ShoppingListService.deleteShoppingList",
                "ShoppingListService.findVisible",
                "ShoppingListService.getShoppingListById",
                "ShoppingListService.updateShoppingList",
                "WatchlistItemService.removeFromWatchlist");
    }

    /** An annotation without the @PreAuthorize interceptor would read as protected and check nothing. */
    @Test
    void methodSecurityWrapsEveryServiceWithAByIdMethod() {
        List<Object> services = ownerScopedServices()
                .filter(service -> byIdMethods(AopUtils.getTargetClass(service)).findAny().isPresent())
                .toList();

        assertThat(services)
                .hasSize(6)
                .allSatisfy(service -> assertThat(service).isInstanceOf(Advised.class))
                .allSatisfy(service -> assertThat(((Advised) service).getAdvisors())
                        .anyMatch(advisor -> advisor instanceof Ordered ordered
                                && ordered.getOrder() == AuthorizationInterceptorsOrder.PRE_AUTHORIZE.getOrder()));
    }

    private Stream<Object> ownerScopedServices() {
        return context.getBeansWithAnnotation(Service.class).values().stream()
                .filter(service -> GUARD_BY_FEATURE.containsKey(AopUtils.getTargetClass(service).getPackageName()));
    }

    private static Stream<Method> byIdMethods(Class<?> serviceClass) {
        return Arrays.stream(serviceClass.getDeclaredMethods())
                .filter(method -> Modifier.isPublic(method.getModifiers()))
                .filter(method -> Arrays.stream(method.getParameters()).anyMatch(OwnershipGuardsTest::isResourceId));
    }

    private static boolean isResourceId(Parameter parameter) {
        return parameter.getType() == UUID.class && !CALLER_PARAMETERS.contains(parameter.getName());
    }

    private static String guardExpression(Method method) {
        PreAuthorize preAuthorize = method.getAnnotation(PreAuthorize.class);
        return preAuthorize == null ? "" : preAuthorize.value();
    }
}
