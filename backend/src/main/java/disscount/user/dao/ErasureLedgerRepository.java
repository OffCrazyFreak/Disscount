package disscount.user.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import disscount.user.domain.ErasureLedgerEntry;

import java.util.UUID;

@Repository
public interface ErasureLedgerRepository extends JpaRepository<ErasureLedgerEntry, UUID> {
}
