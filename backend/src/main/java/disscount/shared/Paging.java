package disscount.shared;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

public final class Paging {

    private Paging() {}

    /** Each paged query fixes its own order, because a client sort could order by a field the caller may not read. */
    public static Pageable withoutClientSort(Pageable requested) {
        return PageRequest.of(requested.getPageNumber(), requested.getPageSize());
    }
}
