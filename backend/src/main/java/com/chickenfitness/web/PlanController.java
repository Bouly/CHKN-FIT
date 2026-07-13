package com.chickenfitness.web;

import com.chickenfitness.dto.PlanDtos.GenerateRequest;
import com.chickenfitness.dto.PlanDtos.PlanDayDto;
import com.chickenfitness.dto.PlanDtos.TeamTodayDto;
import com.chickenfitness.model.User;
import com.chickenfitness.service.FrenchHolidays;
import com.chickenfitness.service.PlanningService;
import com.chickenfitness.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plan")
public class PlanController {

    private final PlanningService planningService;
    private final TeamService teamService;

    public PlanController(PlanningService planningService, TeamService teamService) {
        this.planningService = planningService;
        this.teamService = teamService;
    }

    @GetMapping
    public List<PlanDayDto> calendar(@AuthenticationPrincipal User user,
                                     @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                     @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return planningService.calendar(user, from, to);
    }

    @PostMapping("/generate")
    public Map<String, Integer> generate(@AuthenticationPrincipal User user,
                                         @Valid @RequestBody GenerateRequest req) {
        return Map.of("created", planningService.generate(user, req.weeks()));
    }

    @PostMapping("/recalibrate")
    public Map<String, String> recalibrate(@AuthenticationPrincipal User user) {
        planningService.recalibrate(user);
        return Map.of("status", "ok");
    }

    @GetMapping("/holidays")
    public Map<LocalDate, String> holidays(@RequestParam int year) {
        return FrenchHolidays.forYear(year);
    }

    @GetMapping("/team-today")
    public List<TeamTodayDto> teamToday() {
        return teamService.teamToday();
    }
}
