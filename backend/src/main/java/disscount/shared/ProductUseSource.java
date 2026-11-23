package disscount.shared;

import java.util.List;

/** Implemented by each feature that keeps products on people's lists, so the catalogue ranks by use without importing it. */
public interface ProductUseSource {

    List<ProductUseCount> countPeoplePerEan();
}
