package disscount.productImage.dao;

import java.util.UUID;

import disscount.productImage.domain.ProductImageReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductImageReportRepository extends JpaRepository<ProductImageReport, UUID> {

    boolean existsByImageIdAndUserId(UUID imageId, UUID userId);

    @Modifying
    @Query("delete from ProductImageReport r where r.imageId = :imageId")
    void deleteByImageId(@Param("imageId") UUID imageId);
}
