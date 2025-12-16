package disscount.auth.dto;

import disscount.user.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    
    private String accessToken;
    
    @Builder.Default
    private String tokenType = "Bearer";
    
    private UserDto user;
}
