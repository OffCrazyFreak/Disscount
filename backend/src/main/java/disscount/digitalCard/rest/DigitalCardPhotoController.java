package disscount.digitalCard.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MultipartFile;

import disscount.digitalCard.dto.CardPhotoDto;
import disscount.digitalCard.service.DigitalCardPhotoService;
import disscount.digitalCard.service.DigitalCardPhotoService.PhotoStream;
import disscount.exceptions.BadRequestException;
import disscount.util.SecurityUtils;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/digital-cards/{id}/photos/{slot}")
@RequiredArgsConstructor
@Tag(name = "Digital Card Photos", description = "Card photo upload and download")
public class DigitalCardPhotoController {

    private final DigitalCardPhotoService photoService;

    @Operation(summary = "Upload or replace a card photo (multipart: full, plus thumb for front and back)")
    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CardPhotoDto> upload(
            @PathVariable UUID id,
            @PathVariable String slot,
            @RequestPart("full") MultipartFile full,
            @RequestPart(value = "thumb", required = false) MultipartFile thumb) {
        return ResponseEntity.ok(photoService.upload(SecurityUtils.getCurrentUserId(), id, slot, full, thumb));
    }

    @Operation(summary = "Stream a card photo")
    @GetMapping
    public ResponseEntity<InputStreamResource> download(
            @PathVariable UUID id,
            @PathVariable String slot,
            @RequestParam(defaultValue = "full") String size,
            @RequestParam(required = false) String v,
            WebRequest request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        boolean thumb = parseSize(size);

        // The ETag is derivable from the row alone, so a revalidation never touches object storage.
        String etag = etag(photoService.currentSha256(userId, id, slot), thumb);
        // Spring's comparison, so weak validators and a list of tags in If-None-Match match as RFC 9110 says.
        if (request.checkNotModified(etag)) {
            return null;
        }

        PhotoStream stream = photoService.open(userId, id, slot, thumb, v);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(stream.photo().contentType()))
                .contentLength(stream.photo().contentLength())
                .eTag(etag(stream.sha256(), thumb))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePrivate().immutable())
                .header("X-Content-Type-Options", "nosniff")
                .body(new InputStreamResource(stream.photo().stream()));
    }

    @Operation(summary = "Delete a card photo")
    @DeleteMapping
    public ResponseEntity<Void> delete(@PathVariable UUID id, @PathVariable String slot) {
        photoService.delete(SecurityUtils.getCurrentUserId(), id, slot);
        return ResponseEntity.noContent().build();
    }

    private static boolean parseSize(String size) {
        return switch (size) {
            case "full" -> false;
            case "thumb" -> true;
            default -> throw new BadRequestException("error.cardPhoto.unknownSize");
        };
    }

    private static String etag(String sha256, boolean thumb) {
        return "\"" + sha256 + (thumb ? "-thumb" : "") + "\"";
    }
}
