package disccount.dao;

import disccount.domain.ShoppingList;
import disccount.domain.ShoppingListItem;
import disccount.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

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
}
