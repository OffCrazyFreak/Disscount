package disscount.storeName.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.storeName.dto.StoreNameSuggestionDto;
import disscount.storeName.service.StoreNameService;

import java.util.List;

@RestController
@RequestMapping("/api/store-names")
@RequiredArgsConstructor
@Tag(name = "Store Names", description = "Community store name suggestions")
public class StoreNameController {

    private final StoreNameService storeNameService;

    @Operation(summary = "Search community store names")
    @GetMapping
    public ResponseEntity<List<StoreNameSuggestionDto>> search(@RequestParam(defaultValue = "") String q) {
        return ResponseEntity.ok(storeNameService.search(q));
    }
}
