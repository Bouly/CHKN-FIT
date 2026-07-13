package com.chickenfitness.dto;

import com.chickenfitness.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, message = "Mot de passe : 8 caractères minimum") String password,
            @NotBlank String displayName,
            String avatarEmoji,
            String inviteCode) {}

    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, message = "Mot de passe : 8 caractères minimum") String newPassword) {}

    public record AuthResponse(String token, UserDto user) {}

    public record UpdateProfileRequest(
            String displayName,
            String avatarEmoji,
            Integer heightCm,
            LocalDate birthDate,
            String goal,
            List<String> trainingDays,
            List<String> rotation,
            Boolean followTeamPlan) {}

    public record UserDto(
            Long id,
            String email,
            String displayName,
            String avatarEmoji,
            String role,
            boolean followTeamPlan,
            Integer heightCm,
            LocalDate birthDate,
            String goal,
            List<String> trainingDays,
            List<String> rotation) {

        public static UserDto from(User u) {
            return new UserDto(u.getId(), u.getEmail(), u.getDisplayName(), u.getAvatarEmoji(),
                    u.getRole().name(), u.isFollowTeamPlan(),
                    u.getHeightCm(), u.getBirthDate(), u.getGoal(),
                    u.trainingDaysList().stream().map(Enum::name).toList(),
                    u.rotationList().stream().map(Enum::name).toList());
        }
    }
}
