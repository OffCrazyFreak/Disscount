package disscount.pinnedPlace.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.BadRequestException;
import disscount.pinnedPlace.dao.PinnedPlaceRepository;
import disscount.pinnedPlace.domain.PinnedPlace;
import disscount.pinnedPlace.dto.BulkPinnedPlaceRequest;
import disscount.pinnedPlace.dto.PinnedPlaceDto;
import disscount.pinnedPlace.dto.PinnedPlaceRequest;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PinnedPlaceService {

    private final PinnedPlaceRepository pinnedPlaceRepository;
    private final UserRepository userRepository;

    public List<PinnedPlaceDto> updatePinnedPlaces(UUID userId, BulkPinnedPlaceRequest request) {
        User user = userRepository.requireActiveForUpdate(userId);

        long distinctIds = request.getPlaces().stream().map(PinnedPlaceRequest::getPlaceApiId).distinct().count();

        if (distinctIds < request.getPlaces().size()) {
            throw new BadRequestException("error.pinnedPlace.duplicate");
        }

        pinnedPlaceRepository.deleteAllByUserId(userId);
        pinnedPlaceRepository.flush();

        List<PinnedPlace> saved = pinnedPlaceRepository.saveAll(request.getPlaces().stream()
                .map(place -> PinnedPlace.builder()
                        .user(user)
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
                .userId(pinnedPlace.getUser().getId())
                .placeApiId(pinnedPlace.getPlaceApiId())
                .placeName(pinnedPlace.getPlaceName())
                .build();
    }
}
