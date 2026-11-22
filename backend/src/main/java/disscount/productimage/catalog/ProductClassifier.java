package disscount.productimage.catalog;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Sorts one EAN into a department and an everyday category from what each chain calls and files it under. */
final class ProductClassifier {

    /** One chain's row for the product: its name and the chain's own category text, either may be blank. */
    record Listing(String name, String chainCategory) {}

    record Classification(String department, String category) {}

    private final CatalogTaxonomy taxonomy;

    ProductClassifier(CatalogTaxonomy taxonomy) {
        this.taxonomy = taxonomy;
    }

    /** Majority over the chains for both, ties going to the taxonomy's order, so a rerun gives the same answer. */
    Classification classify(List<Listing> listings) {
        String filedUnder = majority(listings.stream().map(l -> taxonomy.departmentOf(l.chainCategory())).toList(),
                taxonomy.departments().stream().map(CatalogTaxonomy.Department::slug).toList());

        List<String[]> names = listings.stream().map(listing -> TextFold.words(listing.name())).toList();
        List<String> votes = listings.stream().map(listing -> categoryOf(listing, filedUnder)).toList();
        String category = majority(votes.stream().filter(slug -> slug == null || outvotesItsExcludes(slug, votes, names)).toList(),
                taxonomy.categories().stream().map(CatalogTaxonomy.Category::slug).toList());

        if (filedUnder != null || category == null) return new Classification(filedUnder, category);
        return new Classification(taxonomy.category(category).orElseThrow().department(), category);
    }

    /** Chains that name it "Pampers vlažne maramice" outweigh one that wrote only "PAMPERS 48". */
    private boolean outvotesItsExcludes(String slug, List<String> votes, List<String[]> names) {
        CatalogTaxonomy.Category category = taxonomy.category(slug).orElseThrow();
        long against = names.stream().filter(category::excludes).count();
        return votes.stream().filter(slug::equals).count() > against;
    }

    private String categoryOf(Listing listing, String department) {
        String[] name = TextFold.words(listing.name());

        CatalogTaxonomy.Category filed = taxonomy.categoryOf(listing.chainCategory());
        if (filed != null && !filed.excludes(name)) return filed.slug();

        for (CatalogTaxonomy.Category category : taxonomy.categories()) {
            if (category.allows(department) && category.includes(name) && !category.excludes(name)) {
                return category.slug();
            }
        }
        return null;
    }

    private static String majority(List<String> votes, List<String> order) {
        Map<String, Integer> counts = new HashMap<>();
        votes.forEach(vote -> {
            if (vote != null) counts.merge(vote, 1, Integer::sum);
        });

        String best = null;
        for (String slug : order) {
            Integer count = counts.get(slug);
            if (count != null && (best == null || count > counts.get(best))) best = slug;
        }
        return best;
    }
}
