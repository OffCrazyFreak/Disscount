package disscount.storeName.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import disscount.storeName.dto.StoreNameSuggestionDto;
import disscount.storeName.service.StoreNameSuggestionService;

import java.util.List;

@RestController
@RequestMapping("/api/store-names")
@RequiredArgsConstructor
@Tag(name = "Store Names", description = "Community store name suggestions")
public class StoreNameController {

    private final StoreNameSuggestionService storeNameSuggestionService;

    // The same list for everyone, so no current-user lookup: SecurityConfig's
    // anyRequest().authenticated() is the only gate this needs.
    @Operation(summary = "List community store name suggestions")
    @GetMapping
    public ResponseEntity<List<StoreNameSuggestionDto>> getStoreNames() {
        return ResponseEntity.ok(storeNameSuggestionService.listVisible());
    }
}
