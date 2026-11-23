package disscount.productimage.catalog;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;

/** The departments and everyday categories from catalog/taxonomy.yaml, the one place their rules live. */
final class CatalogTaxonomy {

    static final String RESOURCE = "catalog/taxonomy.yaml";

    record Department(String slug, Set<String> chainCategories) {}

    record Category(String slug, String department, Set<String> departments, Set<String> chainCategories,
                    List<NameTerm> include, List<NameTerm> exclude) {

        /** A product whose chains put it in another department is not this category, whatever its name says. */
        boolean allows(String productDepartment) {
            return productDepartment == null || departments.contains(productDepartment);
        }

        boolean includes(String[] name) {
            return include.stream().anyMatch(term -> term.matches(name));
        }

        boolean excludes(String[] name) {
            return exclude.stream().anyMatch(term -> term.matches(name));
        }
    }

    private static CatalogTaxonomy standard;

    private final String version;
    private final List<Department> departments;
    private final List<Category> categories;
    private final Map<String, String> departmentByChainCategory = new HashMap<>();
    private final Map<String, Category> categoryByChainCategory = new HashMap<>();
    private final Map<String, Category> categoryBySlug = new HashMap<>();

    private CatalogTaxonomy(String version, List<Department> departments, List<Category> categories) {
        this.version = version;
        this.departments = List.copyOf(departments);
        this.categories = List.copyOf(categories);

        Set<String> departmentSlugs = new LinkedHashSet<>();
        for (Department department : departments) {
            require(departmentSlugs.add(department.slug()), "department listed twice: " + department.slug());
            department.chainCategories().forEach(chainCategory -> require(
                    departmentByChainCategory.putIfAbsent(chainCategory, department.slug()) == null,
                    "chain category in two departments: " + chainCategory));
        }

        for (Category category : categories) {
            require(categoryBySlug.putIfAbsent(category.slug(), category) == null, "category listed twice: " + category.slug());
            require(departmentSlugs.containsAll(category.departments()), "unknown department in " + category.slug());
            category.chainCategories().forEach(chainCategory -> require(
                    categoryByChainCategory.putIfAbsent(chainCategory, category) == null,
                    "chain category in two categories: " + chainCategory));
        }
    }

    static synchronized CatalogTaxonomy standard() {
        if (standard == null) {
            try (InputStream rules = CatalogTaxonomy.class.getClassLoader().getResourceAsStream(RESOURCE)) {
                if (rules == null) throw new IllegalStateException(RESOURCE + " is missing");
                standard = parse(rules);
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        }
        return standard;
    }

    static CatalogTaxonomy parse(InputStream yaml) throws IOException {
        byte[] content = yaml.readAllBytes();
        Map<String, Object> root = new Yaml(new SafeConstructor(new LoaderOptions())).load(new String(content, StandardCharsets.UTF_8));

        List<Department> departments = new ArrayList<>();
        for (Map<String, Object> entry : maps(root.get("departments"))) {
            departments.add(new Department(text(entry, "slug"), folded(entry.get("chainCategories"))));
        }

        List<Category> categories = new ArrayList<>();
        for (Map<String, Object> entry : maps(root.get("categories"))) {
            String department = text(entry, "department");
            Set<String> allowed = new LinkedHashSet<>(List.of(department));
            allowed.addAll(strings(entry.get("alsoIn")));

            categories.add(new Category(text(entry, "slug"), department, allowed, folded(entry.get("chainCategories")),
                    terms(entry.get("include")), terms(entry.get("exclude"))));
        }
        return new CatalogTaxonomy(versionOf(root), departments, categories);
    }

    /** Stored on each classified row, so changed rules or classifier logic reclassify every product the next archive holds. */
    String version() {
        return version;
    }

    // Hashes the parsed rules, so an edited comment or reflowed list in the file leaves every stored place alone.
    private static String versionOf(Map<String, Object> rules) {
        String classification = ProductClassifier.LOGIC_VERSION + "\n" + rules;
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(classification.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest).substring(0, 16);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    List<Department> departments() {
        return departments;
    }

    List<Category> categories() {
        return categories;
    }

    Optional<Category> category(String slug) {
        return Optional.ofNullable(categoryBySlug.get(slug));
    }

    /** Null for a chain category that names no department, such as "Ostalo" or Tommy's "Pakirana hrana i piće". */
    String departmentOf(String chainCategory) {
        return departmentByChainCategory.get(TextFold.fold(chainCategory));
    }

    /** The category a finer chain group (Roto's, Žabac's) stands for, when it maps to exactly one. */
    Category categoryOf(String chainCategory) {
        return categoryByChainCategory.get(TextFold.fold(chainCategory));
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> maps(Object value) {
        return value == null ? List.of() : (List<Map<String, Object>>) value;
    }

    private static List<String> strings(Object value) {
        if (value == null) return List.of();
        return ((List<?>) value).stream().map(String::valueOf).toList();
    }

    private static Set<String> folded(Object value) {
        Set<String> result = new LinkedHashSet<>();
        strings(value).forEach(chainCategory -> result.add(TextFold.fold(chainCategory)));
        return result;
    }

    private static List<NameTerm> terms(Object value) {
        return strings(value).stream().map(NameTerm::parse).toList();
    }

    private static String text(Map<String, Object> entry, String key) {
        Object value = entry.get(key);
        require(value != null, "missing " + key + " in " + entry);
        return String.valueOf(value);
    }

    private static void require(boolean condition, String problem) {
        if (!condition) throw new IllegalStateException("catalog/taxonomy.yaml: " + problem);
    }
}
