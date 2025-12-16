package disscount.pinnedPlace.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.BadRequestException;
import disscount.pinnedPlace.dao.PinnedPlaceRepository;
import disscount.pinnedPlace.domain.PinnedPlace;
import disscount.pinnedPlace.dto.BulkPinnedPlaceRequest;
import disscount.pinnedPlace.dto.PinnedPlaceDto;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;

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
        pinnedPlaceRepository.flush(); // Force the delete operation to complete before insert

        // Check for duplicate place IDs in the request
        long uniquePlaceIds = request.getPlaces().stream()
                .map(placeRequest -> placeRequest.getPlaceApiId())
                .distinct()
                .count();
        
        if (uniquePlaceIds < request.getPlaces().size()) {
            throw new BadRequestException("Duplicate place IDs found in request");
        }

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
