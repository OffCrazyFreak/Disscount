package disscount.productimage;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface ProductImageReportRepository extends JpaRepository<ProductImageReport, UUID> {

    boolean existsByImageIdAndUserId(UUID imageId, UUID userId);

    List<ProductImageReport> findByUserId(UUID userId);

    @Modifying
    @Query("delete from ProductImageReport r where r.imageId = :imageId")
    void deleteByImageId(@Param("imageId") UUID imageId);
}
