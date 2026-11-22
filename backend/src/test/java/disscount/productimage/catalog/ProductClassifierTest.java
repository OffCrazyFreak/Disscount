package disscount.productimage.catalog;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductClassifierTest {

    final ProductClassifier classifier = new ProductClassifier(CatalogTaxonomy.standard());

    ProductClassifier.Classification sort(String... nameThenChainCategory) {
        List<ProductClassifier.Listing> listings = new ArrayList<>();
        for (int i = 0; i < nameThenChainCategory.length; i += 2) {
            listings.add(new ProductClassifier.Listing(nameThenChainCategory[i], nameThenChainCategory[i + 1]));
        }
        return classifier.classify(listings);
    }

    @Test
    void chainCategoriesFoldToOneDepartmentWhateverTheSpelling() {
        CatalogTaxonomy taxonomy = CatalogTaxonomy.standard();

        assertThat(Arrays.asList("HRANA", "Hrana", "hrana", "Svježi odjeli", "HLAĐENO I SMRZNUTO"))
                .allMatch(text -> "hrana".equals(taxonomy.departmentOf(text)));
        assertThat(Arrays.asList("PIĆE", "PIĆA", "Piće", "piće")).allMatch(text -> "pice".equals(taxonomy.departmentOf(text)));
        assertThat(taxonomy.departmentOf("KUĆNE POTREPŠTINE")).isEqualTo("kucanstvo");
        assertThat(taxonomy.departmentOf("SRED. ZA ĆIŠĆENJE I ODRŽAVANJE")).isEqualTo("sredstva-za-ciscenje");
        assertThat(Arrays.asList("Ostalo", "NEPREHRANA", "PAKIRANA HRANA I PIĆE", "", null))
                .allMatch(text -> taxonomy.departmentOf(text) == null);
    }

    @Test
    void theMajorityOfChainsDecidesTheDepartment() {
        assertThat(sort("ČAJ ŠIPAK 20/1", "HRANA", "ČAJ ŠIPAK", "Piće", "CAJ SIPAK", "hrana").department()).isEqualTo("hrana");
        // A chain that files nothing casts no vote, so one chain is enough.
        assertThat(sort("SPUŽVA 3/1", "NEPREHRANA", "SPUŽVA 3/1", "Proizvodi za kućanstvo").department()).isEqualTo("kucanstvo");
    }

    @Test
    void aProductNoChainFilesTakesItsCategorysDepartment() {
        assertThat(sort("MLIJEKO TRAJNO 2,8% 1L DUKAT", "")).isEqualTo(new ProductClassifier.Classification("hrana", "mlijeko"));
    }

    @Test
    void bodyMilkIsNotMilk() {
        assertThat(sort("MLIJEKO ZA TIJELO NIVEA 400ml", "KOZMETIKA").category()).isNull();
        assertThat(sort("MLIJEKO ZA TIJELO NIVEA 400ml", "").category()).isNull();
        assertThat(sort("AMBRE SOLAIRE MLIJEKO ZA SUNČANJE ZF30", "").category()).isNull();
    }

    @Test
    void chocolateMilkIsMilkAndMilkChocolateIsChocolate() {
        assertThat(sort("MLIJEKO ČOKOLADNO 0,5L DUKAT", "HRANA", "Dukat čokoladno mlijeko 0,5 l", "Hrana").category())
                .isEqualTo("mlijeko");
        assertThat(sort("MILKA ČOKOLADA ALPSKO MLIJEKO 100G", "HRANA").category()).isEqualTo("cokolada");
    }

    @Test
    void easterDecorationsAndChocolateEggsAreNotEggs() {
        assertThat(sort("JAJA SVJEŽA L 10/1 PODNI UZGOJ", "HRANA").category()).isEqualTo("jaja");
        assertThat(sort("JAJA NA ŠTAPIĆU KARO PINK 6/1", "").category()).isNull();
        assertThat(sort("JAJA STAKLENA 6/1 ROZA/BIJELA", "").category()).isNull();
        assertThat(sort("USK.ČOK.JAJA 115g TAMNA S LJEŠ.KREMOM", "Hrana").category()).isNotEqualTo("jaja");
    }

    @Test
    void chainsThatNameTheTrueProductOutvoteOneVagueName() {
        // Two chains say wet wipes, one wrote only the brand.
        assertThat(sort("PAMPERS AQUA PURE 48", "", "VLAŽNE MARAMICE PAMPERS AQUA PURE 48", "",
                "Pampers vlaž. maram. aqua 48", "").category()).isNull();
        assertThat(sort("PAMPERS PREMIUM CARE 4 52", "", "PELENE PAMPERS PREMIUM 52", "").category()).isEqualTo("pelene");
    }

    @Test
    void aFinerChainGroupPlacesAProductItsNameCannot() {
        assertThat(sort("PAN BAČVA 30,0", "PIVO")).isEqualTo(new ProductClassifier.Classification("pice", "pivo"));
    }

    @Test
    void matchingIgnoresCaseAndAccents() {
        assertThat(sort("šećer u prahu 500g", "").category()).isEqualTo("secer");
        assertThat(sort("SECER U PRAHU 500G", "").category()).isEqualTo("secer");
        assertThat(TextFold.fold("Čokoladno MLIJEKO 0,5L Đakovo")).isEqualTo("cokoladno mlijeko 0 5l dakovo");
    }

    @Test
    void termsMatchWholeWordsPrefixesOpeningsAndCombinations() {
        String[] name = TextFold.words("ULJE MASL. EXTRA DJEVIČANSKO 1L");

        assertThat(NameTerm.parse("ulje").matches(name)).isTrue();
        assertThat(NameTerm.parse("ulj").matches(name)).isFalse();
        assertThat(NameTerm.parse("djevicansk*").matches(name)).isTrue();
        assertThat(NameTerm.parse("^extra").matches(name)).isFalse();
        assertThat(NameTerm.parse("extra djevicansko").matches(name)).isTrue();
        assertThat(NameTerm.parse("ulje & masl").matches(name)).isTrue();
        assertThat(NameTerm.parse("ulje & suncok*").matches(name)).isFalse();
    }

    @Test
    void aTaxonomyWithAnUnknownDepartmentIsRefused() {
        String yaml = """
                departments:
                  - slug: hrana
                categories:
                  - slug: mlijeko
                    department: pice
                    include: [mlijeko]
                """;

        assertThatThrownBy(() -> CatalogTaxonomy.parse(new ByteArrayInputStream(yaml.getBytes(StandardCharsets.UTF_8))))
                .hasMessageContaining("unknown department in mlijeko");
    }
}
