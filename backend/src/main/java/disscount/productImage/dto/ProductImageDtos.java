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

    /** The full file keeps the photo's shape, and its size is null on a photo still waiting for its re-render. */
    public record ProductImageDto(UUID id, String fullUrl, @Schema(nullable = true) Integer fullWidth,
                                  @Schema(nullable = true) Integer fullHeight, String smallUrl, String source,
                                  String status) {}

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
            int reportCount,
            LocalDateTime createdAt) {}

    public record AdminProductDto(
            String ean,
            @Schema(nullable = true) String name,
            @Schema(nullable = true) String brand,
            int storeListings,
            int chainCount,
            boolean pinned,
            @Schema(nullable = true) LocalDateTime reviewedAt,
            List<AdminImageDto> images) {}

    public record AdminQueueItemDto(
            String ean,
            @Schema(nullable = true) String name,
            @Schema(nullable = true) String brand,
            int storeListings,
            int chainCount,
            @Schema(nullable = true) String previewUrl,
            int pendingCount,
            int reportedCount,
            @Schema(nullable = true) LocalDateTime reviewedAt) {}

    public record AdminQueuePageDto(List<AdminQueueItemDto> items, long total, int page, int size, long reviewedCount) {}

    /** Photos one user uploaded and how many of them an admin deleted, for the admin users list. */
    public record ContributorPhotoCountDto(UUID userId, long uploaded, long deleted) {}

    public record SetMainRequest(@NotNull UUID imageId) {}

    public record ImageStatusRequest(@NotNull String status) {}

    public record CropRequest(int rotation, @Schema(nullable = true) @Valid CropDto crop) {}
}
