package disscount.shoppingListItem.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import disscount.shoppingList.domain.ShoppingList;
import disscount.shoppingListItem.domain.ShoppingListItem;
import disscount.user.domain.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShoppingListItemRepository extends JpaRepository<ShoppingListItem, UUID> {

    @Query("SELECT sli FROM ShoppingListItem sli WHERE sli.shoppingList = :shoppingList AND sli.deletedAt IS NULL ORDER BY sli.createdAt ASC")
    List<ShoppingListItem> findActiveByShoppingList(ShoppingList shoppingList);

    @Query("SELECT sli FROM ShoppingListItem sli WHERE sli.id = :id AND sli.deletedAt IS NULL")
    Optional<ShoppingListItem> findActiveById(UUID id);

    @Query("SELECT sli FROM ShoppingListItem sli WHERE sli.id = :id AND sli.shoppingList = :shoppingList AND sli.deletedAt IS NULL")
    Optional<ShoppingListItem> findActiveByIdAndShoppingList(UUID id, ShoppingList shoppingList);

    @Query("SELECT sli FROM ShoppingListItem sli WHERE sli.shoppingList.owner = :user AND sli.shoppingList.deletedAt IS NULL AND sli.deletedAt IS NULL ORDER BY sli.shoppingList.updatedAt DESC, sli.createdAt ASC")
    List<ShoppingListItem> findAllActiveItemsByUser(User user);

    @Query("SELECT sli FROM ShoppingListItem sli WHERE sli.shoppingList = :shoppingList AND sli.name = :name AND sli.deletedAt IS NULL")
    Optional<ShoppingListItem> findActiveByShoppingListAndName(ShoppingList shoppingList, String name);
}
