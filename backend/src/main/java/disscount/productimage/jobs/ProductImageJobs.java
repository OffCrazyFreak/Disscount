package disscount.productimage.jobs;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;

import disscount.productimage.HiddenReason;
import disscount.productimage.ImageStatus;
import disscount.productimage.MainPicker;
import disscount.productimage.ProductImage;
import disscount.productimage.ProductImageRepository;
import disscount.productimage.ProductImageSetRepository;
import disscount.productimage.catalog.CatalogImportResult;
import disscount.productimage.catalog.CatalogImportService;
import disscount.productimage.openfoodfacts.OffImageGoneException;
import disscount.productimage.openfoodfacts.OffImageUnavailableException;
import disscount.productimage.render.PhotoRenderFailedException;
import disscount.productimage.render.ProductImageRendering;
import disscount.shared.errors.BadRequestException;
import disscount.shared.errors.NotFoundException;
import disscount.shared.photo.PhotoStore;
import disscount.shared.photo.PhotoStoreConfig;
import disscount.shared.Timestamps;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableConfigurationProperties(ProductImageJobProperties.class)
class ProductImageJobs {

    private static final Logger log = LoggerFactory.getLogger(ProductImageJobs.class);
    // The stored kind keeps its old name, so the existing row is reused and V11 can read its date.
    static final String CATALOG_IMPORT = "weekly-import";
    static final String PHOTO_SEED = "photo-seed";
    // The Open Food Facts export is gigabytes, so the photo seed stays weekly.
    static final Duration SEED_EVERY = Duration.ofDays(7);
    static final int RENDER_BATCH = 10;
    static final Duration RENDER_RETRY_AFTER = Duration.ofHours(1);
    static final Duration RENDER_PAUSE = Duration.ofMinutes(15);
    static final int MAX_RENDER_ATTEMPTS = 5;

    private final boolean enabled;
    @Qualifier(PhotoStoreConfig.PRODUCT_PHOTOS)
    private final PhotoStore store;
    private final CatalogImportService catalog;
    private final OffSeedService seed;
    private final ProductImageRendering rendering;
    private final ProductImageRepository images;
    private final ProductImageSetRepository sets;
    private final ProductImageImportRunRepository runs;
    private final AtomicBoolean importing = new AtomicBoolean();
    private final AtomicBoolean renderingNow = new AtomicBoolean();

    public ProductImageJobs(ProductImageJobProperties properties,
                            @Qualifier(PhotoStoreConfig.PRODUCT_PHOTOS) PhotoStore store, CatalogImportService catalog, OffSeedService seed,
                            ProductImageRendering rendering, ProductImageRepository images,
                            ProductImageSetRepository sets, ProductImageImportRunRepository runs) {
        this.enabled = properties.enabled();
        this.store = store;
        this.catalog = catalog;
        this.seed = seed;
        this.rendering = rendering;
        this.images = images;
        this.sets = sets;
        this.runs = runs;
    }

    /**
     * Hourly, because the upstream publishes each day's archive at no fixed hour; the stored archive date keeps it to one
     * import per date. It feeds the sitemap, so needs no photo store.
     */
    @Scheduled(fixedDelay = 3_600_000L, initialDelay = 10 * 60_000L)
    public void importCatalogue() {
        if (!enabled || !importing.compareAndSet(false, true)) return;
        try {
            try {
                LocalDate lastImported = runs.findById(CATALOG_IMPORT).map(ProductImageImportRun::getArchiveDate).orElse(null);
                Optional<CatalogImportResult> imported = catalog.importNewerThan(lastImported);
                if (imported.isPresent()) {
                    CatalogImportResult result = imported.get();
                    runs.save(new ProductImageImportRun(CATALOG_IMPORT, Timestamps.nowUtc(), result.archiveDate()));
                    // After the run is recorded, so a slow engine never holds the import; a restart here only loses pings.
                    catalog.announce(result);
                }
            } catch (IOException | RuntimeException e) {
                // A failed import leaves the previous catalogue in place, so the seed below can still use it.
                log.error("Catalogue import failed; it is retried at the next check", e);
            }
            // An interrupt during the download can surface as an IOException, so it is checked again here.
            if (Thread.currentThread().isInterrupted()) return;
            // Tracked apart, so turning the photo store on mid-week seeds at the next check, not up to a week later.
            if (store.enabled() && isDue(PHOTO_SEED, SEED_EVERY)) {
                seed.seed();
                runs.save(new ProductImageImportRun(PHOTO_SEED, Timestamps.nowUtc(), null));
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            log.error("Open Food Facts photo seed failed; it is retried at the next check", e);
        } finally {
            importing.set(false);
        }
    }

    private boolean isDue(String kind, Duration every) {
        LocalDateTime last = runs.findById(kind).map(ProductImageImportRun::getFinishedAt).orElse(null);
        return last == null || !last.isAfter(Timestamps.nowUtc().minus(every));
    }

    /** Copies main photos into our photo store one at a time, as Open Food Facts asks of image downloads. */
    @Scheduled(fixedDelay = 15_000L, initialDelay = 2 * 60_000L)
    public void renderMainPhotos() {
        if (!enabled || !store.enabled() || !renderingNow.compareAndSet(false, true)) return;
        try {
            List<ProductImage> batch = images.findUnrenderedMains(ImageStatus.CANDIDATE, Timestamps.nowUtc(),
                    PageRequest.of(0, RENDER_BATCH));
            Held held = null;
            for (ProductImage image : batch) {
                try {
                    rendering.renderCandidate(image);
                    if (held != null) postpone(held.image(), held.cause());
                    held = null;
                } catch (PhotoRenderFailedException e) {
                    if (held != null) {
                        log.warn("Product photo rendering paused: the renderer failed on two photos in a row: {}", e.getMessage());
                        pauseCandidate(held);
                        pauseCandidate(new Held(image, e));
                        return;
                    }
                    held = new Held(image, e);
                } catch (BadRequestException | OffImageGoneException | IllegalArgumentException e) {
                    // IllegalArgumentException: a stored key that cannot form a valid image URL.
                    skip(image, e);
                } catch (OffImageUnavailableException e) {
                    if (!e.concernsThisImageOnly()) {
                        log.warn("Product photo rendering paused: {}", e.getMessage());
                        return;
                    }
                    // A 403 or 500 for one file says nothing about the next one, so only this photo waits.
                    postpone(image, e);
                } catch (RuntimeException e) {
                    // Network or disk trouble: stop here and try the same photos at the next tick.
                    log.warn("Product photo rendering paused: {}", e.getMessage());
                    return;
                }
            }
            if (held != null) postpone(held.image(), held.cause());
            if (batch.isEmpty()) rerenderOlderPhotos();
        } finally {
            renderingNow.set(false);
        }
    }

    /** Only while no new photo waits and one at a time, because the Open Food Facts ones are downloaded again. */
    private void rerenderOlderPhotos() {
        List<ProductImage> older = images.findRenderedBeforeCurrentFiles(List.of(ImageStatus.VERIFIED, ImageStatus.PENDING),
                MAX_RENDER_ATTEMPTS, Timestamps.nowUtc(), PageRequest.of(0, RENDER_BATCH));
        Held held = null;
        for (ProductImage image : older) {
            try {
                rendering.rerender(image);
                if (held != null) retryOlderLater(held.image(), held.cause());
                held = null;
            } catch (PhotoRenderFailedException e) {
                if (held != null) {
                    log.warn("Re-rendering older product photos paused: the renderer failed on two photos in a row: {}",
                            e.getMessage());
                    pauseOlder(held);
                    pauseOlder(new Held(image, e));
                    return;
                }
                held = new Held(image, e);
            } catch (OffImageUnavailableException e) {
                if (!e.concernsThisImageOnly()) {
                    log.warn("Re-rendering older product photos paused: {}", e.getMessage());
                    return;
                }
                retryOlderLater(image, e);
            } catch (BadRequestException | OffImageGoneException | IllegalArgumentException | NotFoundException e) {
                retryOlderLater(image, e);
            } catch (RuntimeException e) {
                log.warn("Re-rendering older product photos paused: {}", e.getMessage());
                return;
            }
        }
        if (held != null) retryOlderLater(held.image(), held.cause());
    }

    /** Charged only once the next photo renders: one bad photo is followed by a success, a broken encoder is not. */
    private record Held(ProductImage image, RuntimeException cause) {}

    /** A photo that already waited once fails again, so it is charged; otherwise it steps aside briefly for free. */
    private void pauseCandidate(Held held) {
        if (held.image().getRenderRetryAt() != null) {
            postpone(held.image(), held.cause());
            return;
        }

        ProductImage image = current(held.image());
        if (image != null) waitBriefly(image);
    }

    private void pauseOlder(Held held) {
        if (held.image().getRenderRetryAt() != null) {
            retryOlderLater(held.image(), held.cause());
            return;
        }

        images.findById(held.image().getId()).ifPresent(this::waitBriefly);
    }

    /** Lets the photos behind it in the queue have a turn without counting an attempt against this one. */
    private void waitBriefly(ProductImage image) {
        image.setRenderRetryAt(Timestamps.nowUtc().plus(RENDER_PAUSE));
        images.save(image);
    }

    /** The photo keeps showing its earlier files; after the last attempt it simply keeps them. */
    private void retryOlderLater(ProductImage loaded, RuntimeException cause) {
        images.findById(loaded.getId()).ifPresent(image -> {
            int attempts = countFailedAttempt(image);
            image.setRenderRetryAt(Timestamps.nowUtc().plus(RENDER_RETRY_AFTER));
            images.save(image);
            log.warn("Could not re-render product photo {} for {} (attempt {}): {}", image.getId(), image.getEan(),
                    attempts, cause.getMessage());
        });
    }

    private void postpone(ProductImage loaded, RuntimeException cause) {
        ProductImage image = current(loaded);
        if (image == null) return;
        int attempts = countFailedAttempt(image);
        if (attempts >= MAX_RENDER_ATTEMPTS) {
            // A photo that keeps failing would hold the main slot forever, so the next photo or a user upload takes it.
            hide(image, cause);
            return;
        }
        log.warn("Retrying product photo {} for {} later: {}", image.getId(), image.getEan(), cause.getMessage());
        image.setRenderRetryAt(Timestamps.nowUtc().plus(RENDER_RETRY_AFTER));
        images.save(image);
    }

    private static int countFailedAttempt(ProductImage image) {
        int attempts = (image.getRenderAttempts() == null ? 0 : image.getRenderAttempts()) + 1;
        image.setRenderAttempts(attempts);
        return attempts;
    }

    /** A photo that cannot be read (a CMYK JPEG, a dead link) would otherwise block the head of the queue forever. */
    private void skip(ProductImage loaded, RuntimeException cause) {
        ProductImage image = current(loaded);
        if (image != null) hide(image, cause);
    }

    /** The row as it is after the download, or null once an admin or the import changed it, so their change stands. */
    private ProductImage current(ProductImage loaded) {
        return images.findById(loaded.getId())
                .filter(i -> ProductImageRendering.stillWaiting(i, loaded))
                .orElse(null);
    }

    private void hide(ProductImage image, RuntimeException cause) {
        log.warn("Skipping product photo {} for {}: {}", image.getId(), image.getEan(), cause.getMessage());
        image.setStatus(ImageStatus.HIDDEN);
        image.setHiddenReason(HiddenReason.JOB_SKIPPED);
        images.save(image);
        sets.findById(image.getEan()).ifPresent(set -> {
            if (image.getId().equals(set.getMainImageId())) {
                set.setMainImageId(MainPicker.pick(images.findByEanOrderByCreatedAtAsc(image.getEan()))
                        .map(ProductImage::getId).orElse(null));
                sets.save(set);
            }
        });
    }
}
