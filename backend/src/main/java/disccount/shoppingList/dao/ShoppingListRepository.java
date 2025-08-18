package disccount.shoppingList.dao;

import disccount.shoppingList.domain.ShoppingList;
import disccount.user.domain.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShoppingListRepository extends JpaRepository<ShoppingList, UUID> {

    @Query("SELECT sl FROM ShoppingList sl WHERE sl.owner = :owner AND sl.deletedAt IS NULL ORDER BY sl.updatedAt DESC")
    List<ShoppingList> findActiveByOwner(User owner);

    @Query("SELECT sl FROM ShoppingList sl WHERE sl.id = :id AND sl.deletedAt IS NULL")
    Optional<ShoppingList> findActiveById(UUID id);

    @Query("SELECT sl FROM ShoppingList sl WHERE sl.id = :id AND sl.owner = :owner AND sl.deletedAt IS NULL")
    Optional<ShoppingList> findActiveByIdAndOwner(UUID id, User owner);

    @Query("SELECT sl FROM ShoppingList sl WHERE sl.isPublic = true AND sl.deletedAt IS NULL ORDER BY sl.updatedAt DESC")
    List<ShoppingList> findActivePublicLists();
}
