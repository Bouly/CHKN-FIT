package com.chickenfitness.web;

import com.chickenfitness.dto.ProgressDtos.PrDto;
import com.chickenfitness.dto.TeamDtos.BadgeDto;
import com.chickenfitness.dto.TeamDtos.FeedItemDto;
import com.chickenfitness.dto.TeamDtos.LeaderboardEntryDto;
import com.chickenfitness.dto.TeamDtos.MemberDto;
import com.chickenfitness.dto.TeamDtos.ResetPasswordResponse;
import com.chickenfitness.dto.TeamDtos.TeamSettingsDto;
import com.chickenfitness.dto.TeamDtos.TeamWeekStatsDto;
import com.chickenfitness.dto.TeamDtos.UpdateTeamSettingsRequest;
import com.chickenfitness.model.User;
import com.chickenfitness.model.enums.Role;
import com.chickenfitness.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/team")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    private static void requireAdmin(User user) {
        if (user.getRole() != Role.ADMIN) {
            throw new SecurityException("Réservé à l'admin de l'équipe");
        }
    }

    // ---- Planning central ----

    @GetMapping("/settings")
    public TeamSettingsDto settings() {
        return teamService.getSettings();
    }

    @PutMapping("/settings")
    public TeamSettingsDto updateSettings(@AuthenticationPrincipal User user,
                                          @Valid @RequestBody UpdateTeamSettingsRequest req) {
        requireAdmin(user);
        return teamService.updateSettings(req);
    }

    @PostMapping("/members/{userId}/reset-password")
    public ResetPasswordResponse resetPassword(@AuthenticationPrincipal User user,
                                               @PathVariable Long userId) {
        requireAdmin(user);
        return new ResetPasswordResponse(teamService.resetPassword(userId));
    }

    // ---- Vie d'équipe ----

    @GetMapping("/leaderboard")
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> leaderboard(@RequestParam(defaultValue = "week") String period) {
        return teamService.leaderboard(period);
    }

    @GetMapping("/week-stats")
    @Transactional(readOnly = true)
    public TeamWeekStatsDto weekStats() {
        return teamService.weekStats();
    }

    @GetMapping("/badges")
    public List<BadgeDto> myBadges(@AuthenticationPrincipal User user) {
        return teamService.badges(user);
    }

    @GetMapping("/members")
    @Transactional(readOnly = true)
    public List<MemberDto> members() {
        return teamService.members();
    }

    @GetMapping("/members/{userId}/records")
    @Transactional(readOnly = true)
    public List<PrDto> memberRecords(@PathVariable Long userId) {
        return teamService.memberRecords(userId);
    }

    @GetMapping("/feed")
    @Transactional(readOnly = true)
    public List<FeedItemDto> feed() {
        return teamService.feed();
    }
}
