package disscount.productimage;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import disscount.productimage.ProductImageDtos.ListedEansDto;
import disscount.productimage.ProductImageDtos.ProductImagesDto;
import disscount.productimage.ProductImageDtos.ProductThumbnailsDto;
import disscount.shared.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Product Images", description = "Product photos: public reads, user uploads and reports")
class ProductImageController {

    private final ProductImageQueryService queries;
    private final ProductImageWriteService writes;

    @Operation(summary = "Photos shown for a product, main photo first")
    @GetMapping("/{ean}/images")
    public ResponseEntity<ProductImagesDto> images(@PathVariable String ean) {
        // no-cache keeps a just-made admin change visible; the files themselves are cached for a year.
        return ResponseEntity.ok().cacheControl(CacheControl.noCache()).body(queries.forProduct(ean));
    }

    @Operation(summary = "Main photo thumbnails for up to 100 EANs, comma separated")
    @GetMapping("/images/thumbnails")
    public ResponseEntity<ProductThumbnailsDto> thumbnails(@RequestParam String eans) {
        List<String> list = Arrays.stream(eans.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        return ResponseEntity.ok().cacheControl(CacheControl.noCache()).body(queries.thumbnails(list));
    }

    @Operation(summary = "EANs with a store price in the latest catalogue import, for the sitemap")
    @GetMapping("/catalog/eans")
    public ResponseEntity<ListedEansDto> listedEans() {
        // The catalogue refreshes weekly, so an hour of caching costs nothing.
        return ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic()).body(queries.listedEans());
    }

    @Operation(summary = "Upload a product photo (multipart field: photo, JPEG)")
    @PostMapping(value = "/{ean}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductImagesDto> upload(@PathVariable String ean, @RequestPart("photo") MultipartFile photo) {
        return ResponseEntity.ok(writes.upload(SecurityUtils.getCurrentUserId(), ean, photo));
    }

    @Operation(summary = "Report a product photo")
    @PostMapping("/images/{imageId}/report")
    public ResponseEntity<Void> report(@PathVariable UUID imageId) {
        writes.report(SecurityUtils.getCurrentUserId(), imageId);
        return ResponseEntity.noContent().build();
    }
}
