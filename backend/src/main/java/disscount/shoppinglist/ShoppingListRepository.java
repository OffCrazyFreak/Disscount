package disscount.shoppinglist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShoppingListRepository extends JpaRepository<ShoppingList, UUID> {

    /** Fetch-joined as ShoppingListMapper walks lazy items, so never paginate; id tiebreak fixes uuid order per database. */
    @Query("SELECT sl FROM ShoppingList sl LEFT JOIN FETCH sl.items "
            + "WHERE sl.ownerId = :ownerId "
            + "ORDER BY sl.updatedAt DESC, sl.createdAt DESC, sl.id DESC")
    List<ShoppingList> findActiveByOwnerId(UUID ownerId);

    @Query("SELECT COUNT(sl) FROM ShoppingList sl WHERE sl.ownerId = :ownerId")
    long countActiveByOwnerId(UUID ownerId);

    @Query("SELECT new disscount.shoppinglist.ListSharing(sl.ownerId, sl.linkAccess) FROM ShoppingList sl WHERE sl.id = :id")
    Optional<ListSharing> findSharingById(UUID id);

    /** Native, so lists the owner deleted lose their link too; @SQLRestriction hides them from JPQL. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "UPDATE app.shopping_list SET link_access = NULL WHERE owner_id = :ownerId AND link_access IS NOT NULL",
            nativeQuery = true)
    int unshareAllOfOwner(UUID ownerId);
}
