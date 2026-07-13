package com.chickenfitness.web;

import com.chickenfitness.dto.ProgressDtos.PrDto;
import com.chickenfitness.dto.TeamDtos.BadgeDto;
import com.chickenfitness.dto.TeamDtos.FeedItemDto;
import com.chickenfitness.dto.TeamDtos.LeaderboardEntryDto;
import com.chickenfitness.dto.TeamDtos.MemberDto;
import com.chickenfitness.model.User;
import com.chickenfitness.service.TeamService;
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

    @GetMapping("/leaderboard")
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> leaderboard(@RequestParam(defaultValue = "week") String period) {
        return teamService.leaderboard(period);
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
