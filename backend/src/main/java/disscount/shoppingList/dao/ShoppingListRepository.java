package disscount.shoppingList.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import disscount.shoppingList.domain.ShoppingList;
import disscount.user.domain.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShoppingListRepository extends JpaRepository<ShoppingList, UUID> {

    /** Fetch-joined because convertToDto walks lazy items; the id tiebreak only keeps order stable, as Postgres and H2 order uuids differently. */
    @Query("SELECT sl FROM ShoppingList sl LEFT JOIN FETCH sl.items "
            + "WHERE sl.owner = :owner AND sl.deletedAt IS NULL "
            + "ORDER BY sl.updatedAt DESC, sl.createdAt DESC, sl.id DESC")
    List<ShoppingList> findActiveByOwner(User owner);

    /** No AndOwner variant on purpose: authorization belongs to ShoppingListService.findVisible, this method's one caller. */
    @Query("SELECT sl FROM ShoppingList sl WHERE sl.id = :id AND sl.deletedAt IS NULL")
    Optional<ShoppingList> findActiveById(UUID id);
}
