package com.chickenfitness.dto;

import java.time.LocalDate;
import java.util.List;

public final class TeamDtos {

    private TeamDtos() {}

    public record LeaderboardEntryDto(int rank, Long userId, String displayName, String avatarEmoji,
                                      int points, long sessions, int streak, long prs, long photos) {}

    public record BadgeDto(String code, String name, String description, String emoji, boolean earned) {}

    public record MemberDto(Long userId, String displayName, String avatarEmoji, int streak,
                            long totalSessions, String goal, List<BadgeDto> badges) {}

    public record FeedItemDto(LocalDate date, String userName, String avatarEmoji, String text, String emoji) {}
}
