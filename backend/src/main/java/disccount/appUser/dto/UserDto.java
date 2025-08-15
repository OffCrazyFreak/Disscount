package disccount.appUser.dto;

import disccount.appUser.domain.enums.SubscriptionTier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    
    private UUID id;
    private String username;
    private String email;
    private LocalDateTime lastLoginAt;
    private Integer stayLoggedInDays;
    private Boolean notificationsPush;
    private Boolean notificationsEmail;
    private SubscriptionTier subscriptionTier;
    private LocalDate subscriptionStartDate;
    private Integer numberOfAiPrompts;
    private LocalDateTime lastAiPromptAt;
    private LocalDateTime createdAt;
}
