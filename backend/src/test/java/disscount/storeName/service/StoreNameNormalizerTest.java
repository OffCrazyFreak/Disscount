package disscount.storeName.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StoreNameNormalizerTest {

    @Test
    void trimsCollapsesLowercasesAndStripsDiacritics() {
        assertThat(StoreNameNormalizer.normalize("  Đurđevac   ŽABAC čšć  ")).isEqualTo("durdevac zabac csc");
        assertThat(StoreNameNormalizer.clean("  Moja   trgovina ")).isEqualTo("Moja trgovina");
    }
}
