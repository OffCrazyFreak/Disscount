package disscount.productimage;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Remembers the last catalogue import and photo seed, so a redeploy does not download the 1.5 GB export again. */
@Entity
@Table(name = "product_image_import_run")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageImportRun {

    @Id
    @Column(length = 32)
    private String kind;

    @Column(name = "finished_at", nullable = false)
    private LocalDateTime finishedAt;
}
