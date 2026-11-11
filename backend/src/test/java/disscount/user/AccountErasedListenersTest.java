package disscount.user;

import disscount.support.FullStackTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.ApplicationListenerMethodAdapter;
import org.springframework.context.support.AbstractApplicationContext;
import org.springframework.core.ResolvableType;
import org.springframework.core.annotation.AnnotationAwareOrderComparator;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** The erasure steps keep the order they had as direct calls, as bulk deletes clear the persistence context. */
class AccountErasedListenersTest extends FullStackTest {

    @Autowired AbstractApplicationContext context;

    @Test
    void listenersRunInTheirFixedOrder() {
        List<String> listeners = context.getApplicationListeners().stream()
                .filter(ApplicationListenerMethodAdapter.class::isInstance)
                .map(ApplicationListenerMethodAdapter.class::cast)
                .filter(listener -> listener.supportsEventType(ResolvableType.forClass(AccountErased.class)))
                .sorted(AnnotationAwareOrderComparator.INSTANCE)
                .map(ApplicationListenerMethodAdapter::getListenerId)
                .toList();

        assertThat(listeners).containsExactly(
                "disscount.digitalcard.DigitalCardService.onAccountErased(disscount.user.AccountErased)",
                "disscount.storename.StoreNameService.onAccountErased(disscount.user.AccountErased)",
                "disscount.preferences.favoritestore.FavoriteStoreService.onAccountErased(disscount.user.AccountErased)",
                "disscount.productimage.ProductImageErasure.onAccountErased(disscount.user.AccountErased)",
                "disscount.shoppinglist.ShoppingListService.onAccountErased(disscount.user.AccountErased)",
                "disscount.contact.ContactMessageService.onAccountErased(disscount.user.AccountErased)");
    }
}
