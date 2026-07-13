package com.chickenfitness.service;

import com.chickenfitness.model.TeamSettings;
import com.chickenfitness.model.User;
import com.chickenfitness.model.WorkoutSession;
import com.chickenfitness.model.enums.Focus;
import com.chickenfitness.model.enums.SessionStatus;
import com.chickenfitness.repository.TeamSettingsRepository;
import com.chickenfitness.repository.WorkoutSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PlanningServiceTest {

    private WorkoutSessionRepository sessionRepository;
    private TeamSettingsRepository teamSettingsRepository;
    private PlanningService planning;
    private User user;

    // Semaine de référence : lundi 20 juillet 2026 (aucun férié)
    private static final LocalDate MON = LocalDate.of(2026, 7, 20);

    @BeforeEach
    void setUp() {
        sessionRepository = mock(WorkoutSessionRepository.class);
        teamSettingsRepository = mock(TeamSettingsRepository.class);
        when(teamSettingsRepository.findById(TeamSettings.SINGLETON_ID))
                .thenReturn(Optional.empty());
        planning = new PlanningService(sessionRepository, teamSettingsRepository);

        user = new User();
        user.setTrainingDays("MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY");
        user.setRotation("CHEST,BACK,SHOULDERS,ARMS,LEGS");
        user.setFollowTeamPlan(false);
    }

    @Test
    void normalWeekFollowsTheSplitDayByDay() {
        assertEquals(Focus.CHEST, planning.focusForDate(user, MON));
        assertEquals(Focus.BACK, planning.focusForDate(user, MON.plusDays(1)));
        assertEquals(Focus.SHOULDERS, planning.focusForDate(user, MON.plusDays(2)));
        assertEquals(Focus.ARMS, planning.focusForDate(user, MON.plusDays(3)));
        assertEquals(Focus.LEGS, planning.focusForDate(user, MON.plusDays(4)));
    }

    @Test
    void holidayShiftsTheRestOfTheWeekForEveryone() {
        // semaine du 13 juillet 2026 : mardi 14 = férié
        LocalDate mon13 = LocalDate.of(2026, 7, 13);
        assertEquals(Focus.CHEST, planning.focusForDate(user, mon13));
        assertEquals(Focus.BACK, planning.focusForDate(user, mon13.plusDays(2)));      // mercredi
        assertEquals(Focus.SHOULDERS, planning.focusForDate(user, mon13.plusDays(3))); // jeudi
        assertEquals(Focus.ARMS, planning.focusForDate(user, mon13.plusDays(4)));      // vendredi
        // et la semaine suivante repart normalement
        assertEquals(Focus.CHEST, planning.focusForDate(user, mon13.plusDays(7)));
    }

    @Test
    void holidayIsNeverEligible() {
        assertFalse(planning.isEligibleDay(user, LocalDate.of(2026, 7, 14)));
        assertTrue(planning.isEligibleDay(user, LocalDate.of(2026, 7, 13)));
        assertFalse(planning.isEligibleDay(user, LocalDate.of(2026, 7, 18))); // samedi
    }

    @Test
    void offDayAdhocSuggestsFirstFocusNotCompletedThisWeek() {
        // pecs validé lundi → un adhoc le samedi doit proposer DOS (rattrapage)
        WorkoutSession done = new WorkoutSession();
        done.setDate(MON);
        done.setFocus(Focus.CHEST);
        done.setStatus(SessionStatus.COMPLETED);
        when(sessionRepository.findByUserAndStatusAndDateBetween(
                any(), any(), any(), any())).thenReturn(List.of(done));

        assertEquals(Focus.BACK, planning.nextFocusFor(user, MON.plusDays(5)));
    }

    @Test
    void eligibleDayAdhocMatchesTheGroupSession() {
        when(sessionRepository.findByUserAndStatusAndDateBetween(
                any(), any(), any(), any())).thenReturn(List.of());
        // jeudi = bras, même si rien n'a été validé avant : on reste calé sur le groupe
        assertEquals(Focus.ARMS, planning.nextFocusFor(user, MON.plusDays(3)));
    }

    @Test
    void followersUseTheTeamPlanInsteadOfTheirOwn() {
        TeamSettings team = new TeamSettings();
        team.setRotation("LEGS,CHEST,BACK,SHOULDERS,ARMS");
        when(teamSettingsRepository.findById(TeamSettings.SINGLETON_ID))
                .thenReturn(Optional.of(team));

        user.setRotation("CARDIO"); // réglage perso différent
        user.setFollowTeamPlan(true);
        assertEquals(Focus.LEGS, planning.focusForDate(user, MON));

        user.setFollowTeamPlan(false);
        assertEquals(Focus.CARDIO, planning.focusForDate(user, MON));
    }
}
