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

    /**
     * Fetch-joins the items, because convertToDto walks them for every row and the
     * association is LAZY: a user with 20 lists cost 21 queries on the lists screen.
     * Safe as a join fetch since this query is not paginated, and the in-memory
     * deletedAt filter in convertToDto still drops soft-deleted items. No DISTINCT:
     * Hibernate 6 de-duplicates fetched parents itself and would pass the keyword
     * through to SQL as needless work.
     *
     * <p>The id tiebreak only keeps the order stable between requests. It is not
     * portable: Postgres compares uuid as 16 unsigned bytes while H2 has compared
     * as two signed longs, so a test must assert stability rather than a winner.
     */
    @Query("SELECT sl FROM ShoppingList sl LEFT JOIN FETCH sl.items "
            + "WHERE sl.owner = :owner AND sl.deletedAt IS NULL "
            + "ORDER BY sl.updatedAt DESC, sl.createdAt DESC, sl.id DESC")
    List<ShoppingList> findActiveByOwner(User owner);

    /**
     * The only way a by-id request loads a list, deliberately. There is no
     * "...AndOwner" variant, because that was the old authorization mechanism and a
     * future method reaching for it would silently get owner-only semantics back plus
     * the 400-not-404 answer that tells a stranger the id was real. Authorization now
     * belongs to ShoppingListService.findVisible, which is this method's one caller.
     */
    @Query("SELECT sl FROM ShoppingList sl WHERE sl.id = :id AND sl.deletedAt IS NULL")
    Optional<ShoppingList> findActiveById(UUID id);
}
