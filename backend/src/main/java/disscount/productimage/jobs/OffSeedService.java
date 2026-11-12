package disscount.productimage.jobs;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import disscount.productimage.MainPicker;
import disscount.productimage.ProductImageRepository;
import disscount.productimage.ProductImageSetRepository;
import disscount.productimage.openfoodfacts.OffExportReader;
import disscount.productimage.openfoodfacts.OffExportReader.Front;
import disscount.productimage.openfoodfacts.OpenFoodFactsClient;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@RequiredArgsConstructor
class OffSeedService {

    private static final Logger log = LoggerFactory.getLogger(OffSeedService.class);
    private static final int CHUNK = 500;

    private final OpenFoodFactsClient off;
    private final ProductImageSetRepository sets;
    private final ProductImageRepository images;
    private final OffCandidateWriter candidates;
    private final TransactionTemplate tx;

    public int seed() throws IOException, InterruptedException {
        Set<String> wanted = new HashSet<>(sets.findAllEans());

        Map<String, Front> fronts;
        try (InputStream export = off.openProductsExport()) {
            fronts = OffExportReader.read(export, wanted);
        }

        List<Map.Entry<String, Front>> entries = new ArrayList<>(fronts.entrySet());
        for (int from = 0; from < entries.size(); from += CHUNK) {
            List<Map.Entry<String, Front>> chunk = entries.subList(from, Math.min(entries.size(), from + CHUNK));
            tx.executeWithoutResult(status -> chunk.forEach(e -> apply(e.getKey(), e.getValue())));
        }
        log.info("Open Food Facts seed: {} of {} catalogue EANs have a front photo", fronts.size(), wanted.size());
        return fronts.size();
    }

    void apply(String ean, Front front) {
        candidates.upsert(ean, front.externalKey(), front.rev(), front.lang());
        sets.findById(ean).filter(set -> !set.isPinned()).ifPresent(set -> {
            MainPicker.pick(images.findByEanOrderByCreatedAtAsc(ean)).ifPresent(best -> {
                set.setMainImageId(best.getId());
                sets.save(set);
            });
        });
    }
}
