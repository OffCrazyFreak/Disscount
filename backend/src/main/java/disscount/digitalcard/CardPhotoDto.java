package disscount.digitalcard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
class CardPhotoDto {

    private String slot;
    private String sha256;
}
