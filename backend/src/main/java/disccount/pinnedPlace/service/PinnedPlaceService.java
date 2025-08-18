package disccount.pinnedPlace.service;

import disccount.exceptions.BadRequestException;
import disccount.pinnedPlace.dao.PinnedPlaceRepository;
import disccount.pinnedPlace.domain.PinnedPlace;
import disccount.pinnedPlace.dto.PinnedPlaceDto;
import disccount.user.dao.UserRepository;
import disccount.user.domain.User;
import disccount.pinnedPlace.dto.BulkPinnedPlaceRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PinnedPlaceService {

    private final PinnedPlaceRepository pinnedPlaceRepository;
    private final UserRepository userRepository;

    public List<PinnedPlaceDto> updatePinnedPlaces(UUID userId, BulkPinnedPlaceRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        // First, delete all existing pinned places for this user
        List<PinnedPlace> existingPlaces = pinnedPlaceRepository.findByUserId(userId);
        pinnedPlaceRepository.deleteAll(existingPlaces);

        // Then create new pinned places
        List<PinnedPlace> newPinnedPlaces = request.getPlaces().stream()
                .map(placeRequest -> PinnedPlace.builder()
                        .user(user)
                        .placeApiId(placeRequest.getPlaceApiId())
                        .placeName(placeRequest.getPlaceName())
                        .build())
                .collect(Collectors.toList());

        List<PinnedPlace> saved = pinnedPlaceRepository.saveAll(newPinnedPlaces);
        return saved.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PinnedPlaceDto> getUserPinnedPlaces(UUID userId) {
        return pinnedPlaceRepository.findByUserId(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
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
