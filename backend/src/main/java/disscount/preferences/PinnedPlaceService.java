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
@Transactional
public class PinnedPlaceService {

    private final PinnedPlaceRepository pinnedPlaceRepository;
    private final ActiveUsers activeUsers;

    public List<PinnedPlaceDto> updatePinnedPlaces(UUID userId, BulkPinnedPlaceRequest request) {
        activeUsers.lockActive(userId);

        long distinctIds = request.getPlaces().stream().map(PinnedPlaceRequest::getPlaceApiId).distinct().count();

        if (distinctIds < request.getPlaces().size()) {
            throw new BadRequestException("error.pinnedPlace.duplicate");
        }

        pinnedPlaceRepository.deleteAllByUserId(userId);
        pinnedPlaceRepository.flush();

        List<PinnedPlace> saved = pinnedPlaceRepository.saveAll(request.getPlaces().stream()
                .map(place -> PinnedPlace.builder()
                        .userId(userId)
                        .placeApiId(place.getPlaceApiId())
                        .placeName(place.getPlaceName())
                        .build())
                .toList());

        return saved.stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<PinnedPlaceDto> getUserPinnedPlaces(UUID userId) {
        return pinnedPlaceRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .toList();
    }

    private PinnedPlaceDto mapToDto(PinnedPlace pinnedPlace) {
        return PinnedPlaceDto.builder()
                .id(pinnedPlace.getId())
                .userId(pinnedPlace.getUserId())
                .placeApiId(pinnedPlace.getPlaceApiId())
                .placeName(pinnedPlace.getPlaceName())
                .build();
    }
}
