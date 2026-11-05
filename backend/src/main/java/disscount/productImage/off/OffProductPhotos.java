package disscount.productImage.off;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import tools.jackson.databind.JsonNode;

/** The photos Open Food Facts holds for one product: selected fronts per language, then raw uploads. */
public record OffProductPhotos(List<Photo> fronts, List<Photo> raws) {

    /** Raw uploads beyond this are mostly ingredient and nutrition shots nobody would pick. */
    static final int MAX_RAWS = 30;

    public record Photo(String externalKey, String rev, String lang, String imgid) {}

    /** Parses the `images` object of a v2 product response; one front per raw photo, Croatian first. */
    static OffProductPhotos parse(JsonNode images) {
        if (images == null || !images.isObject()) return new OffProductPhotos(List.of(), List.of());

        Map<String, Photo> frontByImgid = new HashMap<>();
        List<String> rawIds = new ArrayList<>();
        for (Map.Entry<String, JsonNode> entry : images.properties()) {
            String key = entry.getKey();
            JsonNode value = entry.getValue();

            if (key.chars().allMatch(Character::isDigit)) {
                rawIds.add(key);
            } else if (key.startsWith("front_") && value.hasNonNull("rev")) {
                String lang = key.substring("front_".length());
                Photo photo = new Photo(key, value.get("rev").asString(""), lang, value.path("imgid").asString(null));
                String imgid = photo.imgid() == null ? key : photo.imgid();
                Photo existing = frontByImgid.get(imgid);
                if (existing == null || langRank(lang) < langRank(existing.lang())) {
                    frontByImgid.put(imgid, photo);
                }
            }
        }

        List<Photo> fronts = new ArrayList<>(frontByImgid.values());
        fronts.sort(Comparator.comparingInt((Photo p) -> langRank(p.lang())).thenComparing(Photo::lang));

        Set<String> usedByFronts = new HashSet<>(frontByImgid.keySet());
        List<Photo> raws = rawIds.stream()
                .filter(id -> !usedByFronts.contains(id))
                .sorted(Comparator.comparingInt((String id) -> Integer.parseInt(id)).reversed())
                .limit(MAX_RAWS)
                .map(id -> new Photo("raw:" + id, null, null, id))
                .toList();

        return new OffProductPhotos(fronts, raws);
    }

    public static int langRank(String lang) {
        if ("hr".equals(lang)) return 0;
        if ("en".equals(lang)) return 1;
        return 2;
    }
}
