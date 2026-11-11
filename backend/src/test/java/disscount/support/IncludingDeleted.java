package disscount.support;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Table;

import java.util.Optional;
import java.util.UUID;

/** Reads a row whatever its deleted_at, as @SQLRestriction hides soft-deleted rows from every JPA lookup. */
public final class IncludingDeleted {

    private IncludingDeleted() {}

    public static <T> Optional<T> find(EntityManager entityManager, Class<T> entity, UUID id) {
        String table = entity.getAnnotation(Table.class).name();

        return entityManager.createNativeQuery("SELECT * FROM " + table + " WHERE id = :id", entity)
                .setParameter("id", id)
                .getResultList()
                .stream()
                .findFirst()
                .map(entity::cast);
    }
}
