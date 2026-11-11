package disscount.shoppinglist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
interface ShoppingListItemRepository extends JpaRepository<ShoppingListItem, UUID> {

    @Query("SELECT sli FROM ShoppingListItem sli WHERE sli.shoppingList = :shoppingList ORDER BY sli.createdAt ASC")
    List<ShoppingListItem> findActiveByShoppingList(ShoppingList shoppingList);

    @Query("SELECT sli FROM ShoppingListItem sli WHERE sli.id = :id AND sli.shoppingList = :shoppingList")
    Optional<ShoppingListItem> findActiveByIdAndShoppingList(UUID id, ShoppingList shoppingList);
}
