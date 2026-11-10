package disscount.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
interface ErasureLedgerRepository extends JpaRepository<ErasureLedgerEntry, UUID> {
}
