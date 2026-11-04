package disscount.productImage.rest;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import disscount.config.SecurityConfig;
import disscount.productImage.dto.ProductImageDtos.ListedEansDto;
import disscount.productImage.dto.ProductImageDtos.ProductImageDto;
import disscount.productImage.dto.ProductImageDtos.ProductImagesDto;
import disscount.productImage.dto.ProductImageDtos.ProductThumbnailsDto;
import disscount.productImage.service.ProductImageAdminService;
import disscount.productImage.service.ProductImageQueryService;
import disscount.productImage.service.ProductImageWriteService;
import disscount.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {ProductImageController.class, AdminProductImageController.class})
@Import(SecurityConfig.class)
class ProductImageControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean ProductImageQueryService queries;
    @MockitoBean ProductImageWriteService writes;
    @MockitoBean ProductImageAdminService admin;
    @MockitoBean UserService userService;

    final UUID userId = UUID.randomUUID();

    RequestPostProcessor auth() {
        return jwt().jwt(j -> j.subject(userId.toString()));
    }

    @Test
    void photosAndThumbnailsAreReadableWithoutLogin() throws Exception {
        UUID id = UUID.randomUUID();
        when(queries.forProduct("8076800195057")).thenReturn(new ProductImagesDto("8076800195057",
                List.of(new ProductImageDto(id, "https://i/full.jpg", "https://i/thumb.jpg", "https://i/small.jpg", "OPEN_FOOD_FACTS", "VERIFIED"))));
        when(queries.thumbnails(List.of("8076800195057", "5449000000996")))
                .thenReturn(new ProductThumbnailsDto(Map.of("8076800195057", "https://i/thumb.jpg")));

        mvc.perform(get("/api/products/8076800195057/images"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-cache"))
                .andExpect(jsonPath("$.images[0].id").value(id.toString()));
        mvc.perform(get("/api/products/images/thumbnails").param("eans", "8076800195057, 5449000000996,"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thumbnails.8076800195057").value("https://i/thumb.jpg"));
    }

    @Test
    void listedEansAreReadableWithoutLogin() throws Exception {
        when(queries.listedEans()).thenReturn(new ListedEansDto(List.of("5449000000996", "8076800195057")));

        mvc.perform(get("/api/products/catalog/eans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eans[1]").value("8076800195057"));
    }

    @Test
    void uploadsReportsAndAdminCallsNeedALogin() throws Exception {
        MockMultipartFile photo = new MockMultipartFile("photo", "p.jpg", "image/jpeg", new byte[] {1});

        mvc.perform(multipart("/api/products/8076800195057/images").file(photo)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/products/images/{id}/report", UUID.randomUUID())).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/product-images/queue")).andExpect(status().isUnauthorized());
        verifyNoInteractions(writes, admin);
    }

    @Test
    void adminEndpointsRejectRegularUsers() throws Exception {
        mvc.perform(get("/api/admin/product-images/queue").with(auth())).andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/product-images/8076800195057/refresh").with(auth())).andExpect(status().isForbidden());
        verifyNoInteractions(admin);
    }

    @Test
    void uploadPassesTheCurrentUser() throws Exception {
        MockMultipartFile photo = new MockMultipartFile("photo", "p.jpg", "image/jpeg", new byte[] {1});
        when(writes.upload(any(), any(), any())).thenReturn(new ProductImagesDto("8076800195057", List.of()));

        mvc.perform(multipart("/api/products/8076800195057/images").file(photo).with(auth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ean").value("8076800195057"));
    }
}
