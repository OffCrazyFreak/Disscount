package disscount.shared;

import java.util.List;

import org.springframework.data.domain.Page;

/** Our own page shape, so a Spring Data upgrade cannot change what the frontend parses. */
public record PageDto<T>(List<T> items, PageInfoDto page) {

    public record PageInfoDto(int number, int size, long totalItems, int totalPages) {}

    public static <T> PageDto<T> from(Page<T> page) {
        PageInfoDto info = new PageInfoDto(page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
        return new PageDto<>(page.getContent(), info);
    }
}
