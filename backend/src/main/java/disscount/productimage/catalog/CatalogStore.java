package disscount.productimage.catalog;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import disscount.shared.CanonicalBarcode;
import disscount.shared.ProductUseSource;
import disscount.shared.Timestamps;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Component;

/** Writes one archive into the catalogue tables; the caller runs it in one transaction. */
@Component
class CatalogStore {

    private static final int BATCH = 1_000;
    // Kept as a row in the import run table, so the marker needs no table of its own.
    static final String CHAIN_HISTORY = "chain-history";

    private final JdbcTemplate jdbc;
    private final List<ProductUseSource> useSources;

    CatalogStore(JdbcTemplate jdbc, List<ProductUseSource> useSources) {
        this.jdbc = jdbc;
        this.useSources = useSources;
    }

    /**
     * Chain and store counts cover every chain that priced the EAN in the listing window, so a product's rank does not
     * jump with which chains published today, and a product that left the window drops to zero.
     */
    CatalogImportResult store(Map<String, CatalogArchiveReader.Entry> catalog, LocalDate archiveDate) {
        Set<String> listedBefore = listed();

        storeProducts(catalog, archiveDate);
        storeChainPrices(catalog, archiveDate);
        recountChains(chainHistoryStart(archiveDate));
        refreshListUses();

        Set<String> listedAfter = listed();
        return new CatalogImportResult(archiveDate, catalog.size(), difference(listedAfter, listedBefore),
                difference(listedBefore, listedAfter));
    }

    private record StoredProduct(String name, String brand, LocalDate lastSeenOn, String department, String category,
                                 String taxonomyVersion) {}

    private record Place(String department, String category) {}

    private void storeProducts(Map<String, CatalogArchiveReader.Entry> catalog, LocalDate archiveDate) {
        CatalogTaxonomy taxonomy = CatalogTaxonomy.standard();
        Map<String, StoredProduct> stored = storedProducts();

        List<Object[]> updates = new ArrayList<>();
        List<Object[]> inserts = new ArrayList<>();
        catalog.forEach((ean, e) -> {
            // An unpriced catalogue row is not on sale, so it leaves the date of its last price alone.
            LocalDate seenOn = e.storeListings() > 0 ? archiveDate : null;
            StoredProduct before = stored.get(ean);
            if (before == null) {
                inserts.add(new Object[] {ean, e.name(), e.brand(), seenOn, e.department(), e.category(), taxonomy.version()});
                return;
            }

            // New rules replace the stored place outright.
            Place place = taxonomy.version().equals(before.taxonomyVersion()) ? merged(taxonomy, before, e)
                    : new Place(e.department(), e.category());
            StoredProduct after = new StoredProduct(e.name(), e.brand(), later(before.lastSeenOn(), seenOn),
                    place.department(), place.category(), taxonomy.version());

            // Most rows come back unchanged on most days, and a skipped update writes no new row version.
            if (!after.equals(before)) {
                updates.add(new Object[] {after.name(), after.brand(), after.lastSeenOn(), after.department(), after.category(),
                        after.taxonomyVersion(), ean});
            }
        });

        batch("""
                update app.product_image_set set name = ?, brand = ?, last_seen_on = ?::date, department = ?, category = ?,
                    taxonomy_version = ?
                where ean = ?
                """, updates);
        batch("""
                insert into app.product_image_set (ean, name, brand, store_listings, chain_count, last_seen_on,
                    department, category, taxonomy_version, pinned, needs_review)
                values (?, ?, ?, 0, 0, ?::date, ?, ?, ?, false, false)
                """, inserts);
    }

    private Map<String, StoredProduct> storedProducts() {
        Map<String, StoredProduct> stored = new HashMap<>();
        jdbc.query("select ean, name, brand, last_seen_on, department, category, taxonomy_version from app.product_image_set",
                (RowCallbackHandler) row -> stored.put(row.getString(1), new StoredProduct(row.getString(2), row.getString(3),
                        row.getObject(4, LocalDate.class), row.getString(5), row.getString(6), row.getString(7))));
        return stored;
    }

    /** An older archive cannot move a product back in time, and an unpriced day leaves the date alone. */
    private static LocalDate later(LocalDate stored, LocalDate seenOn) {
        if (stored == null) return seenOn;
        if (seenOn == null) return stored;
        return seenOn.isAfter(stored) ? seenOn : stored;
    }

    /**
     * Under the same rules a day with no signal keeps the stored place; a new department keeps the stored category only
     * where the category allows that department, so the pair never contradicts itself.
     */
    private static Place merged(CatalogTaxonomy taxonomy, StoredProduct stored, CatalogArchiveReader.Entry today) {
        if (today.department() == null && today.category() == null) return new Place(stored.department(), stored.category());
        if (today.category() != null) return new Place(today.department(), today.category());

        String category = Optional.ofNullable(stored.category())
                .flatMap(taxonomy::category)
                .filter(c -> c.allows(today.department()))
                .map(CatalogTaxonomy.Category::slug)
                .orElse(null);
        return new Place(today.department(), category);
    }

    private void storeChainPrices(Map<String, CatalogArchiveReader.Entry> catalog, LocalDate archiveDate) {
        List<Object[]> rows = new ArrayList<>();
        catalog.forEach((ean, e) -> e.pricesByChain()
                .forEach((chain, prices) -> rows.add(new Object[] {ean, chain, prices, archiveDate})));

        // The where clause skips a row an archive repeats, so importing the same date again writes nothing.
        batch("""
                insert into app.product_chain_listing as c (ean, chain, store_listings, last_seen_on) values (?, ?, ?, ?)
                on conflict (ean, chain) do update set
                    store_listings = case when excluded.last_seen_on >= c.last_seen_on
                        then excluded.store_listings else c.store_listings end,
                    last_seen_on = greatest(c.last_seen_on, excluded.last_seen_on)
                where excluded.last_seen_on > c.last_seen_on
                    or (excluded.last_seen_on = c.last_seen_on and excluded.store_listings <> c.store_listings)
                """, rows);
    }

    /**
     * The first archive date the chain table holds, stored once; the oldest chain row cannot tell, since the daily
     * expiry deletes old rows and every live row is refreshed.
     */
    private LocalDate chainHistoryStart(LocalDate archiveDate) {
        jdbc.update("""
                insert into app.product_image_import_run as r (kind, finished_at, archive_date) values (?, ?, ?)
                on conflict (kind) do update set archive_date = least(r.archive_date, excluded.archive_date)
                """, CHAIN_HISTORY, Timestamps.nowUtc(), archiveDate);
        return jdbc.queryForObject("select archive_date from app.product_image_import_run where kind = ?", LocalDate.class,
                CHAIN_HISTORY);
    }

    /**
     * Products still in the window without chain rows were listed before chains were tracked; they keep their counts.
     * Until the chain history reaches back over the whole window, it holds only the days since deploy, so it may raise
     * a count but not lower it.
     */
    private void recountChains(LocalDate historyStart) {
        LocalDate since = CatalogListing.listedSince(newestArchive());
        if (since == null) return;

        boolean coversWindow = !historyStart.isAfter(since);

        jdbc.update("delete from app.product_chain_listing where last_seen_on < ?", since);
        jdbc.update("""
                update app.product_image_set s set chain_count = a.chains, store_listings = a.listings
                from (select ean, count(*)::int as chains, sum(store_listings)::int as listings
                      from app.product_chain_listing group by ean) a
                where s.ean = a.ean and (s.chain_count <> a.chains or s.store_listings <> a.listings)
                    and (? or a.chains > s.chain_count or (a.chains = s.chain_count and a.listings > s.store_listings))
                """, coversWindow);
        jdbc.update("""
                update app.product_image_set set chain_count = 0, store_listings = 0
                where (last_seen_on is null or last_seen_on < ?) and (chain_count <> 0 or store_listings <> 0)
                """, since);
    }

    /** Lists keep the EAN a product page gave them, and older rows may be padded, so each is folded the catalogue's way. */
    private void refreshListUses() {
        Map<String, Integer> people = new HashMap<>();
        useSources.forEach(source -> source.countPeoplePerEan()
                .forEach(use -> people.merge(CanonicalBarcode.of(use.ean()), (int) use.people(), Integer::sum)));

        Map<String, Integer> stored = new HashMap<>();
        jdbc.query("select ean, list_uses from app.product_image_set where list_uses <> 0",
                (RowCallbackHandler) row -> stored.put(row.getString(1), row.getInt(2)));

        List<Object[]> changes = new ArrayList<>();
        people.forEach((ean, uses) -> {
            if (!uses.equals(stored.get(ean))) changes.add(new Object[] {uses, ean});
        });
        stored.keySet().stream().filter(ean -> !people.containsKey(ean)).forEach(ean -> changes.add(new Object[] {0, ean}));

        batch("update app.product_image_set set list_uses = ? where ean = ?", changes);
    }

    private LocalDate newestArchive() {
        return jdbc.queryForObject("select max(last_seen_on) from app.product_image_set", LocalDate.class);
    }

    private Set<String> listed() {
        LocalDate since = CatalogListing.listedSince(newestArchive());
        if (since == null) return Set.of();

        return new HashSet<>(jdbc.queryForList("select ean from app.product_image_set where last_seen_on >= ?",
                String.class, since));
    }

    private static List<String> difference(Set<String> from, Set<String> minus) {
        return from.stream().filter(ean -> !minus.contains(ean)).sorted().toList();
    }

    private void batch(String sql, List<Object[]> rows) {
        for (int from = 0; from < rows.size(); from += BATCH) {
            jdbc.batchUpdate(sql, rows.subList(from, Math.min(rows.size(), from + BATCH)));
        }
    }
}
