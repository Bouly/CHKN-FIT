package com.chickenfitness.service;

import com.chickenfitness.dto.PlanDtos.TeamTodayDto;
import com.chickenfitness.dto.ProgressDtos.PrDto;
import com.chickenfitness.dto.TeamDtos.BadgeDto;
import com.chickenfitness.dto.TeamDtos.FeedItemDto;
import com.chickenfitness.dto.TeamDtos.LeaderboardEntryDto;
import com.chickenfitness.dto.TeamDtos.MemberDto;
import com.chickenfitness.model.User;
import com.chickenfitness.model.WorkoutSession;
import com.chickenfitness.model.enums.SessionStatus;
import com.chickenfitness.repository.MeasurementRepository;
import com.chickenfitness.repository.ProgressPhotoRepository;
import com.chickenfitness.repository.UserRepository;
import com.chickenfitness.repository.WorkoutSessionRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class TeamService {

    private final UserRepository userRepository;
    private final WorkoutSessionRepository sessionRepository;
    private final ProgressPhotoRepository photoRepository;
    private final MeasurementRepository measurementRepository;
    private final PlanningService planningService;
    private final StatsService statsService;

    public TeamService(UserRepository userRepository,
                       WorkoutSessionRepository sessionRepository,
                       ProgressPhotoRepository photoRepository,
                       MeasurementRepository measurementRepository,
                       PlanningService planningService,
                       StatsService statsService) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.photoRepository = photoRepository;
        this.measurementRepository = measurementRepository;
        this.planningService = planningService;
        this.statsService = statsService;
    }

    /**
     * Points : séance validée = 20, PR = 15, photo = 5, mensuration = 3, + 2 par jour de streak.
     */
    public List<LeaderboardEntryDto> leaderboard(String period) {
        LocalDate today = LocalDate.now();
        LocalDate from = switch (period == null ? "week" : period) {
            case "month" -> today.withDayOfMonth(1);
            case "all" -> LocalDate.of(2000, 1, 1);
            default -> today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        };

        List<LeaderboardEntryDto> entries = new ArrayList<>();
        for (User u : userRepository.findAll()) {
            long sessions = sessionRepository
                    .findByUserAndStatusAndDateBetween(u, SessionStatus.COMPLETED, from, today).size();
            long prs = statsService.prEvents(u).stream()
                    .filter(p -> !p.date().isBefore(from)).count();
            long photos = photoRepository.countByUserAndTakenAtBetween(u, from, today);
            long measures = measurementRepository.countByUserAndDateBetween(u, from, today);
            int streak = planningService.currentStreak(u);
            int points = (int) (20 * sessions + 15 * prs + 5 * photos + 3 * measures) + 2 * streak;
            entries.add(new LeaderboardEntryDto(0, u.getId(), u.getDisplayName(), u.getAvatarEmoji(),
                    points, sessions, streak, prs, photos));
        }
        entries.sort(Comparator.comparingInt(LeaderboardEntryDto::points).reversed());
        List<LeaderboardEntryDto> ranked = new ArrayList<>();
        for (int i = 0; i < entries.size(); i++) {
            LeaderboardEntryDto e = entries.get(i);
            ranked.add(new LeaderboardEntryDto(i + 1, e.userId(), e.displayName(), e.avatarEmoji(),
                    e.points(), e.sessions(), e.streak(), e.prs(), e.photos()));
        }
        return ranked;
    }

    public List<BadgeDto> badges(User user) {
        long total = sessionRepository.countByUserAndStatus(user, SessionStatus.COMPLETED);
        int streak = planningService.currentStreak(user);
        long prs = statsService.prEvents(user).size();
        long photos = photoRepository.countByUser(user);

        List<BadgeDto> list = new ArrayList<>();
        list.add(badge("FIRST_WORKOUT", "L'œuf a éclos", "Première séance validée", "🐣", total >= 1));
        list.add(badge("TEN_WORKOUTS", "Poussin assidu", "10 séances validées", "🐤", total >= 10));
        list.add(badge("FIFTY_WORKOUTS", "Coq de la salle", "50 séances validées", "🐓", total >= 50));
        list.add(badge("HUNDRED_WORKOUTS", "Poulet légendaire", "100 séances validées", "👑", total >= 100));
        list.add(badge("STREAK_5", "Série chaude", "5 jours d'entraînement d'affilée", "🔥", streak >= 5));
        list.add(badge("STREAK_20", "Inarrêtable", "20 jours d'entraînement d'affilée", "⚡", streak >= 20));
        list.add(badge("FIRST_PR", "Record battu", "Premier record personnel", "💪", prs >= 1));
        list.add(badge("TEN_PRS", "Machine à PR", "10 records personnels", "🏆", prs >= 10));
        list.add(badge("TEN_PHOTOS", "Photogénique", "10 photos de progression", "📸", photos >= 10));
        return list;
    }

    private static BadgeDto badge(String code, String name, String desc, String emoji, boolean earned) {
        return new BadgeDto(code, name, desc, emoji, earned);
    }

    public List<MemberDto> members() {
        List<MemberDto> members = new ArrayList<>();
        for (User u : userRepository.findAll()) {
            long total = sessionRepository.countByUserAndStatus(u, SessionStatus.COMPLETED);
            int streak = planningService.currentStreak(u);
            List<BadgeDto> earned = badges(u).stream().filter(BadgeDto::earned).toList();
            members.add(new MemberDto(u.getId(), u.getDisplayName(), u.getAvatarEmoji(),
                    streak, total, u.getGoal(), earned));
        }
        members.sort(Comparator.comparingLong(MemberDto::totalSessions).reversed());
        return members;
    }

    /** Qui s'entraîne aujourd'hui, et où ils en sont. */
    public List<TeamTodayDto> teamToday() {
        LocalDate today = LocalDate.now();
        List<TeamTodayDto> result = new ArrayList<>();
        for (User u : userRepository.findAll()) {
            var session = sessionRepository.findByUserAndDate(u, today);
            String status;
            String focus = null, focusEmoji = null;
            if (session.isPresent()) {
                status = session.get().getStatus().name();
                focus = session.get().getFocus().getLabel();
                focusEmoji = session.get().getFocus().getEmoji();
            } else if (!planningService.isEligibleDay(u, today)) {
                status = "REST";
            } else {
                status = "NONE";
            }
            result.add(new TeamTodayDto(u.getId(), u.getDisplayName(), u.getAvatarEmoji(),
                    status, focus, focusEmoji));
        }
        return result;
    }

    /** Fil d'activité : dernières séances validées + PRs associés. */
    public List<FeedItemDto> feed() {
        List<FeedItemDto> items = new ArrayList<>();
        for (WorkoutSession s : sessionRepository.findTop30ByStatusOrderByDateDescIdDesc(SessionStatus.COMPLETED)) {
            User u = s.getUser();
            long prsThatDay = statsService.prEvents(u).stream()
                    .filter(p -> p.date().equals(s.getDate())).count();
            String text = "a validé sa séance " + s.getFocus().getLabel()
                    + " (" + s.getSets().size() + " séries"
                    + (prsThatDay > 0 ? ", " + prsThatDay + " PR 🎉" : "") + ")";
            items.add(new FeedItemDto(s.getDate(), u.getDisplayName(), u.getAvatarEmoji(),
                    text, s.getFocus().getEmoji()));
        }
        return items;
    }

    public List<PrDto> memberRecords(Long userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new java.util.NoSuchElementException("Membre introuvable"));
        return statsService.currentRecords(u);
    }
}
