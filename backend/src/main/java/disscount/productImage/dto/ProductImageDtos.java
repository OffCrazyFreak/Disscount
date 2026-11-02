package disscount.productImage.dto;

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

    public record CropDto(int x, int y, int width, int height) {}

    public record AdminImageDto(
            UUID id,
            String source,
            String status,
            String lang,
            String previewUrl,
            String fullUrl,
            String originalUrl,
            boolean rendered,
            boolean main,
            int rotation,
            CropDto crop,
            Integer originalWidth,
            Integer originalHeight,
            int reportCount,
            LocalDateTime createdAt) {}

    public record AdminProductDto(
            String ean,
            String name,
            String brand,
            int storeListings,
            int chainCount,
            UUID mainImageId,
            boolean pinned,
            boolean needsReview,
            LocalDateTime reviewedAt,
            LocalDateTime offDetailsFetchedAt,
            List<AdminImageDto> images) {}

    public record AdminQueueItemDto(
            String ean,
            String name,
            String brand,
            int storeListings,
            int chainCount,
            String previewUrl,
            int imageCount,
            int pendingCount,
            int reportedCount,
            boolean needsReview,
            LocalDateTime reviewedAt) {}

    public record AdminQueuePageDto(List<AdminQueueItemDto> items, long total, int page, int size, long reviewedCount) {}

    public record SetMainRequest(@NotNull UUID imageId) {}

    public record ImageStatusRequest(@NotNull String status) {}

    public record CropRequest(int rotation, @Valid CropDto crop) {}
}
