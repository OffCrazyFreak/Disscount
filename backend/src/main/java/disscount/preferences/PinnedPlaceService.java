package disscount.preferences;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.shared.BadRequestException;
import disscount.user.ActiveUsers;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PinnedPlaceService {

    private final PinnedPlaceRepository pinnedPlaceRepository;
    private final ActiveUsers activeUsers;

    @Transactional
    public List<PinnedPlaceDto> updatePinnedPlaces(UUID userId, BulkPinnedPlaceRequest request) {
        activeUsers.lockActive(userId);

        long distinctIds = request.places().stream().map(PinnedPlaceRequest::placeApiId).distinct().count();

        if (distinctIds < request.places().size()) {
            throw new BadRequestException("error.pinnedPlace.duplicate");
        }

        pinnedPlaceRepository.deleteAllByUserId(userId);
        pinnedPlaceRepository.flush();

        List<PinnedPlace> saved = pinnedPlaceRepository.saveAll(request.places().stream()
                .map(place -> PinnedPlace.builder()
                        .userId(userId)
                        .placeApiId(place.placeApiId())
                        .placeName(place.placeName())
                        .build())
                .toList());

        return saved.stream().map(PinnedPlaceDto::from).toList();
    }

    public List<PinnedPlaceDto> getUserPinnedPlaces(UUID userId) {
        return pinnedPlaceRepository.findByUserId(userId).stream()
                .map(PinnedPlaceDto::from)
                .toList();
    }
}
