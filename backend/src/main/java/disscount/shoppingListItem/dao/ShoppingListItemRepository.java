package disscount.shoppingListItem.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import disscount.shoppingList.domain.ShoppingList;
import disscount.shoppingListItem.domain.ShoppingListItem;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShoppingListItemRepository extends JpaRepository<ShoppingListItem, UUID> {

    @Query("SELECT sli FROM ShoppingListItem sli WHERE sli.shoppingList = :shoppingList AND sli.deletedAt IS NULL ORDER BY sli.createdAt ASC")
    List<ShoppingListItem> findActiveByShoppingList(ShoppingList shoppingList);

    @Query("SELECT sli FROM ShoppingListItem sli WHERE sli.id = :id AND sli.shoppingList = :shoppingList AND sli.deletedAt IS NULL")
    Optional<ShoppingListItem> findActiveByIdAndShoppingList(UUID id, ShoppingList shoppingList);
}
