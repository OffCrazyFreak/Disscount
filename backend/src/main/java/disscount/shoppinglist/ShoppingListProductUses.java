package disscount.shoppinglist;

import java.util.List;

import disscount.shared.ProductUseCount;
import disscount.shared.ProductUseSource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional(readOnly = true)
class ShoppingListProductUses implements ProductUseSource {

    private final ShoppingListRepository lists;

    ShoppingListProductUses(ShoppingListRepository lists) {
        this.lists = lists;
    }

    @Override
    public List<ProductUseCount> countPeoplePerEan() {
        return lists.countOwnersPerEan();
    }
}
