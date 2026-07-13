package com.chickenfitness.dto;

import com.chickenfitness.model.TeamSettings;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDate;
import java.util.List;

public final class TeamDtos {

    private TeamDtos() {}

    public record LeaderboardEntryDto(int rank, Long userId, String displayName, String avatarEmoji,
                                      int points, long sessions, int streak, long prs, long photos) {}

    public record BadgeDto(String code, String name, String description, String emoji, boolean earned) {}

    public record MemberDto(Long userId, String displayName, String avatarEmoji, String role,
                            boolean followTeamPlan, int streak, long totalSessions, String goal,
                            List<BadgeDto> badges) {}

    public record FeedItemDto(LocalDate date, String userName, String avatarEmoji, String text, String emoji) {}

    public record TeamSettingsDto(List<String> trainingDays, List<String> rotation) {
        public static TeamSettingsDto from(TeamSettings t) {
            return new TeamSettingsDto(
                    t.trainingDaysList().stream().map(Enum::name).toList(),
                    t.rotationList().stream().map(Enum::name).toList());
        }
    }

    public record UpdateTeamSettingsRequest(
            @NotEmpty List<String> trainingDays,
            @NotEmpty List<String> rotation) {}

    public record ResetPasswordResponse(String tempPassword) {}

    /** Stats collectives de la semaine en cours (lundi → aujourd'hui). */
    public record TeamWeekStatsDto(long totalVolumeKg, int totalSessions, long totalSets) {}
}
