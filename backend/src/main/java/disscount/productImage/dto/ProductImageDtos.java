package disscount.productImage.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public final class ProductImageDtos {

    private ProductImageDtos() {}

    /** A photo as everyone sees it; the first in a list is the main one. */
    public record ProductImageDto(UUID id, String fullUrl, String thumbUrl, String source, String status) {}

    public record ProductImagesDto(String ean, List<ProductImageDto> images) {}

    public record ProductThumbnailsDto(Map<String, String> thumbnails) {}

    public record ListedEansDto(List<String> eans) {}

    public record CropDto(int x, int y, int width, int height) {}

    public record AdminImageDto(
            UUID id,
            String source,
            String status,
            @Schema(nullable = true) String lang,
            @Schema(nullable = true) String previewUrl,
            @Schema(nullable = true) String fullUrl,
            String originalUrl,
            boolean rendered,
            boolean main,
            int rotation,
            @Schema(nullable = true) CropDto crop,
            @Schema(nullable = true) Integer originalWidth,
            @Schema(nullable = true) Integer originalHeight,
            int reportCount,
            LocalDateTime createdAt) {}

    public record AdminProductDto(
            String ean,
            @Schema(nullable = true) String name,
            @Schema(nullable = true) String brand,
            int storeListings,
            int chainCount,
            @Schema(nullable = true) UUID mainImageId,
            boolean pinned,
            boolean needsReview,
            @Schema(nullable = true) LocalDateTime reviewedAt,
            @Schema(nullable = true) LocalDateTime offDetailsFetchedAt,
            List<AdminImageDto> images) {}

    public record AdminQueueItemDto(
            String ean,
            @Schema(nullable = true) String name,
            @Schema(nullable = true) String brand,
            int storeListings,
            int chainCount,
            @Schema(nullable = true) String previewUrl,
            int imageCount,
            int pendingCount,
            int reportedCount,
            boolean needsReview,
            @Schema(nullable = true) LocalDateTime reviewedAt) {}

    public record AdminQueuePageDto(List<AdminQueueItemDto> items, long total, int page, int size, long reviewedCount) {}

    public record SetMainRequest(@NotNull UUID imageId) {}

    public record ImageStatusRequest(@NotNull String status) {}

    public record CropRequest(int rotation, @Schema(nullable = true) @Valid CropDto crop) {}
}
