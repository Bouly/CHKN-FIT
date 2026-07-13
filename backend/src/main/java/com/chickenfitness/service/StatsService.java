package com.chickenfitness.service;

import com.chickenfitness.dto.PlanDtos.SessionSummaryDto;
import com.chickenfitness.dto.ProgressDtos.DashboardDto;
import com.chickenfitness.dto.ProgressDtos.ExercisePointDto;
import com.chickenfitness.dto.ProgressDtos.PrDto;
import com.chickenfitness.dto.ProgressDtos.VolumePointDto;
import com.chickenfitness.model.Measurement;
import com.chickenfitness.model.SetEntry;
import com.chickenfitness.model.User;
import com.chickenfitness.model.WorkoutSession;
import com.chickenfitness.model.enums.SessionStatus;
import com.chickenfitness.repository.MeasurementRepository;
import com.chickenfitness.repository.ProgressPhotoRepository;
import com.chickenfitness.repository.SetEntryRepository;
import com.chickenfitness.repository.WorkoutSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class StatsService {

    private final WorkoutSessionRepository sessionRepository;
    private final SetEntryRepository setEntryRepository;
    private final MeasurementRepository measurementRepository;
    private final ProgressPhotoRepository photoRepository;
    private final PlanningService planningService;

    public StatsService(WorkoutSessionRepository sessionRepository,
                        SetEntryRepository setEntryRepository,
                        MeasurementRepository measurementRepository,
                        ProgressPhotoRepository photoRepository,
                        PlanningService planningService) {
        this.sessionRepository = sessionRepository;
        this.setEntryRepository = setEntryRepository;
        this.measurementRepository = measurementRepository;
        this.photoRepository = photoRepository;
        this.planningService = planningService;
    }

    /**
     * Événements PR : chaque fois qu'une série bat le meilleur e1RM connu de l'exercice,
     * c'est un PR. Rejoué chronologiquement sur tout l'historique complété.
     */
    public List<PrDto> prEvents(User user) {
        Map<Long, Double> best = new HashMap<>();
        List<PrDto> events = new ArrayList<>();
        for (SetEntry e : setEntryRepository.findAllCompletedByUser(user.getId())) {
            Double e1rm = e.e1rm();
            if (e1rm == null) continue;
            Long exId = e.getExercise().getId();
            Double b = best.get(exId);
            if (b == null || e1rm > b + 0.001) {
                best.put(exId, e1rm);
                if (b != null) { // la toute première perf n'est pas un "record battu"
                    events.add(new PrDto(exId, e.getExercise().getName(), e.getWeightKg(),
                            e.getReps(), round1(e1rm), e.getSession().getDate()));
                }
            }
        }
        return events;
    }

    @Transactional
    public DashboardDto dashboard(User user) {
        planningService.sweepMissed(user);
        LocalDate today = LocalDate.now();

        int streak = planningService.currentStreak(user);
        long totalCompleted = sessionRepository.countByUserAndStatus(user, SessionStatus.COMPLETED);

        // assiduité sur 30 jours : séances faites / jours éligibles passés
        LocalDate from30 = today.minusDays(29);
        int eligible = 0;
        for (LocalDate d = from30; !d.isAfter(today); d = d.plusDays(1)) {
            if (planningService.isEligibleDay(user, d)) eligible++;
        }
        long done30 = sessionRepository
                .findByUserAndStatusAndDateBetween(user, SessionStatus.COMPLETED, from30, today).size();
        int attendance = eligible == 0 ? 0 : (int) Math.round(100.0 * done30 / eligible);

        SessionSummaryDto todaySession = sessionRepository.findByUserAndDate(user, today)
                .map(SessionSummaryDto::from).orElse(null);
        String holidayName = FrenchHolidays.nameOf(today);

        LocalDate nextTraining;
        boolean todayDone = todaySession != null
                && (todaySession.status().equals("COMPLETED") || todaySession.status().equals("SKIPPED"));
        if (planningService.isEligibleDay(user, today) && !todayDone) {
            nextTraining = today;
        } else {
            nextTraining = planningService.nextEligibleDay(user, today.plusDays(1));
        }

        List<PrDto> prs = prEvents(user);
        List<PrDto> recentPrs = prs.stream()
                .sorted(Comparator.comparing(PrDto::date).reversed())
                .limit(5).toList();

        Double currentWeight = null, delta30 = null;
        List<Measurement> measures = measurementRepository.findByUserOrderByDateAsc(user);
        List<Measurement> withWeight = measures.stream().filter(m -> m.getWeightKg() != null).toList();
        if (!withWeight.isEmpty()) {
            currentWeight = withWeight.get(withWeight.size() - 1).getWeightKg();
            Measurement oldest30 = withWeight.stream()
                    .filter(m -> !m.getDate().isBefore(from30))
                    .findFirst().orElse(null);
            if (oldest30 != null && !oldest30.getDate().equals(withWeight.get(withWeight.size() - 1).getDate())) {
                delta30 = round1(currentWeight - oldest30.getWeightKg());
            }
        }

        long photoCount = photoRepository.countByUser(user);

        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = monday.plusDays(6);
        int weekEligible = 0;
        for (LocalDate d = monday; !d.isAfter(sunday); d = d.plusDays(1)) {
            if (planningService.isEligibleDay(user, d)) weekEligible++;
        }
        int weekCompleted = sessionRepository
                .findByUserAndStatusAndDateBetween(user, SessionStatus.COMPLETED, monday, sunday).size();

        return new DashboardDto(streak, totalCompleted, attendance, todaySession, today,
                holidayName != null, holidayName, nextTraining, recentPrs,
                currentWeight, delta30, photoCount, weekCompleted, weekEligible);
    }

    public List<ExercisePointDto> exerciseProgress(User user, Long exerciseId) {
        Map<LocalDate, double[]> byDate = new TreeMap<>(); // [bestE1rm, topWeight, volume]
        for (SetEntry e : setEntryRepository.findCompletedByUserAndExercise(user.getId(), exerciseId)) {
            LocalDate d = e.getSession().getDate();
            double[] acc = byDate.computeIfAbsent(d, k -> new double[]{-1, -1, 0});
            Double e1rm = e.e1rm();
            if (e1rm != null && e1rm > acc[0]) acc[0] = e1rm;
            if (e.getWeightKg() != null && e.getWeightKg() > acc[1]) acc[1] = e.getWeightKg();
            if (e.getWeightKg() != null && e.getReps() != null) acc[2] += e.getWeightKg() * e.getReps();
        }
        List<ExercisePointDto> points = new ArrayList<>();
        byDate.forEach((d, acc) -> points.add(new ExercisePointDto(d,
                acc[0] < 0 ? null : round1(acc[0]),
                acc[1] < 0 ? null : acc[1],
                round1(acc[2]))));
        return points;
    }

    public List<VolumePointDto> weeklyVolume(User user, int weeks) {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusWeeks(weeks - 1)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        Map<LocalDate, Double> volume = new LinkedHashMap<>();
        Map<LocalDate, java.util.Set<Long>> sessions = new HashMap<>();
        for (LocalDate w = start; !w.isAfter(today); w = w.plusWeeks(1)) {
            volume.put(w, 0.0);
            sessions.put(w, new java.util.HashSet<>());
        }
        for (SetEntry e : setEntryRepository.findCompletedByUserBetween(user.getId(), start, today)) {
            LocalDate week = e.getSession().getDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            if (!volume.containsKey(week)) continue;
            if (e.getWeightKg() != null && e.getReps() != null) {
                volume.merge(week, e.getWeightKg() * e.getReps(), Double::sum);
            }
            sessions.get(week).add(e.getSession().getId());
        }
        List<VolumePointDto> points = new ArrayList<>();
        volume.forEach((w, v) -> points.add(new VolumePointDto(w, Math.round(v), sessions.get(w).size())));
        return points;
    }

    /** Records actuels : la meilleure perf (e1RM) de chaque exercice pratiqué. */
    public List<PrDto> currentRecords(User user) {
        Map<Long, PrDto> best = new LinkedHashMap<>();
        for (SetEntry e : setEntryRepository.findAllCompletedByUser(user.getId())) {
            Double e1rm = e.e1rm();
            if (e1rm == null) continue;
            Long exId = e.getExercise().getId();
            PrDto b = best.get(exId);
            if (b == null || e1rm > b.e1rm()) {
                best.put(exId, new PrDto(exId, e.getExercise().getName(), e.getWeightKg(),
                        e.getReps(), round1(e1rm), e.getSession().getDate()));
            }
        }
        return best.values().stream()
                .sorted(Comparator.comparing(PrDto::e1rm).reversed())
                .toList();
    }

    /** Historique des séances complétées (pour la page progression). */
    public List<WorkoutSession> completedSessions(User user) {
        return sessionRepository.findByUserAndStatusOrderByDateAsc(user, SessionStatus.COMPLETED);
    }

    /** Export CSV de toutes les séries des séances validées. */
    public String exportCsv(User user) {
        StringBuilder sb = new StringBuilder(
                "date;seance;exercice;serie;poids_kg;reps;duree_sec;distance_m;e1rm\n");
        for (SetEntry e : setEntryRepository.findAllCompletedByUser(user.getId())) {
            Double e1rm = e.e1rm();
            sb.append(e.getSession().getDate()).append(';')
                    .append(e.getSession().getFocus().getLabel()).append(';')
                    .append(e.getExercise().getName().replace(";", ",")).append(';')
                    .append(e.getSetNumber()).append(';')
                    .append(e.getWeightKg() != null ? e.getWeightKg() : "").append(';')
                    .append(e.getReps() != null ? e.getReps() : "").append(';')
                    .append(e.getDurationSec() != null ? e.getDurationSec() : "").append(';')
                    .append(e.getDistanceM() != null ? e.getDistanceM() : "").append(';')
                    .append(e1rm != null ? round1(e1rm) : "").append('\n');
        }
        return sb.toString();
    }

    private static Double round1(Double v) {
        return v == null ? null : Math.round(v * 10) / 10.0;
    }
}
