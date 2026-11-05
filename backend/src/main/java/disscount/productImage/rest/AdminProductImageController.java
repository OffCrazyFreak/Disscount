package disscount.productImage.rest;

import java.util.List;
import java.util.UUID;

import disscount.productImage.dto.ProductImageDtos.AdminProductDto;
import disscount.productImage.dto.ProductImageDtos.AdminQueuePageDto;
import disscount.productImage.dto.ProductImageDtos.ContributorPhotoCountDto;
import disscount.productImage.dto.ProductImageDtos.CropRequest;
import disscount.productImage.dto.ProductImageDtos.ImageStatusRequest;
import disscount.productImage.dto.ProductImageDtos.SetMainRequest;
import disscount.productImage.service.ProductImageAdminService;
import disscount.storage.StoredPhoto;
import disscount.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/product-images")
@RequiredArgsConstructor
@Tag(name = "Admin Product Images", description = "Review queue and photo curation")
public class AdminProductImageController {

    private final ProductImageAdminService admin;

    @Operation(summary = "Products to go through, most widely sold first (filter: todo, pending, reported)")
    @GetMapping("/queue")
    public AdminQueuePageDto queue(@RequestParam(defaultValue = "todo") String filter,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "50") int size) {
        return admin.queue(filter, page, size);
    }

    @Operation(summary = "Every photo of a product, hidden and unconfirmed included")
    @GetMapping("/{ean}")
    public AdminProductDto product(@PathVariable String ean) {
        return admin.product(ean);
    }

    @Operation(summary = "Fetch all Open Food Facts photos of the product as candidates")
    @PostMapping("/{ean}/refresh")
    public AdminProductDto refresh(@PathVariable String ean) {
        return admin.refreshFromOpenFoodFacts(ean);
    }

    @Operation(summary = "Show this photo first; automatic picks will not replace it")
    @PutMapping("/{ean}/main")
    public AdminProductDto setMain(@PathVariable String ean, @Valid @RequestBody SetMainRequest request) {
        return admin.setMain(SecurityUtils.getCurrentUserId(), ean, request.imageId());
    }

    @Operation(summary = "Mark the product as gone through")
    @PostMapping("/{ean}/reviewed")
    public AdminProductDto reviewed(@PathVariable String ean) {
        return admin.reviewed(SecurityUtils.getCurrentUserId(), ean);
    }

    @Operation(summary = "Verify (also clears reports) or hide a photo")
    @PutMapping("/images/{imageId}/status")
    public AdminProductDto status(@PathVariable UUID imageId, @Valid @RequestBody ImageStatusRequest request) {
        return admin.setStatus(SecurityUtils.getCurrentUserId(), imageId, request.status());
    }

    @Operation(summary = "Delete a photo's files for good; the same file or Open Food Facts photo cannot come back")
    @DeleteMapping("/images/{imageId}")
    public AdminProductDto delete(@PathVariable UUID imageId) {
        return admin.delete(SecurityUtils.getCurrentUserId(), imageId);
    }

    @Operation(summary = "Photos each user uploaded and how many an admin deleted")
    @GetMapping("/contributors")
    public List<ContributorPhotoCountDto> contributors() {
        return admin.contributorCounts();
    }

    @Operation(summary = "Rotate and crop a photo from its original; a null crop keeps the whole photo")
    @PutMapping("/images/{imageId}/crop")
    public AdminProductDto crop(@PathVariable UUID imageId, @Valid @RequestBody CropRequest request) {
        return admin.crop(SecurityUtils.getCurrentUserId(), imageId, request.rotation(), request.crop());
    }

    @Operation(summary = "The private original of a user or admin photo, for the crop screen")
    @GetMapping("/images/{imageId}/original")
    public ResponseEntity<InputStreamResource> original(@PathVariable UUID imageId) {
        StoredPhoto photo = admin.original(imageId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.contentType()))
                .contentLength(photo.contentLength())
                .cacheControl(CacheControl.noStore())
                .header("X-Content-Type-Options", "nosniff")
                .body(new InputStreamResource(photo.stream()));
    }
}
