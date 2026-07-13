package com.chickenfitness.service;

import com.chickenfitness.dto.PlanDtos.PlanDayDto;
import com.chickenfitness.dto.PlanDtos.SessionSummaryDto;
import com.chickenfitness.model.User;
import com.chickenfitness.model.WorkoutSession;
import com.chickenfitness.model.enums.Focus;
import com.chickenfitness.model.enums.SessionStatus;
import com.chickenfitness.repository.WorkoutSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Planning intelligent :
 * - génère les séances sur les jours d'entraînement de chacun, en sautant les jours fériés ;
 * - la rotation musculaire se DÉCALE au lieu de sauter : si le mardi "Pull" tombe un férié
 *   ou est skippé, le prochain jour dispo reprend "Pull" — aucun groupe musculaire n'est perdu ;
 * - les séances planifiées dans le passé et jamais faites passent automatiquement en MISSED,
 *   puis le futur est recalibré.
 */
@Service
public class PlanningService {

    private final WorkoutSessionRepository sessionRepository;

    public PlanningService(WorkoutSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public boolean isEligibleDay(User user, LocalDate date) {
        return user.trainingDaysList().contains(date.getDayOfWeek())
                && !FrenchHolidays.isHoliday(date);
    }

    /** Prochain jour d'entraînement possible (aujourd'hui inclus). */
    public LocalDate nextEligibleDay(User user, LocalDate from) {
        LocalDate d = from;
        for (int i = 0; i < 366; i++) {
            if (isEligibleDay(user, d)) return d;
            d = d.plusDays(1);
        }
        return null;
    }

    /** Génère les séances manquantes sur N semaines, puis recalibre la rotation. */
    @Transactional
    public int generate(User user, int weeks) {
        LocalDate today = LocalDate.now();
        LocalDate end = today.plusWeeks(weeks);
        Set<LocalDate> existing = sessionRepository
                .findByUserAndDateBetweenOrderByDateAsc(user, today, end).stream()
                .map(WorkoutSession::getDate)
                .collect(Collectors.toSet());

        int created = 0;
        List<Focus> rotation = user.rotationList();
        Focus fallback = rotation.isEmpty() ? Focus.FULL_BODY : rotation.get(0);
        for (LocalDate d = today; !d.isAfter(end); d = d.plusDays(1)) {
            if (!isEligibleDay(user, d) || existing.contains(d)) continue;
            WorkoutSession s = new WorkoutSession();
            s.setUser(user);
            s.setDate(d);
            s.setFocus(fallback); // provisoire, réattribué par recalibrate()
            s.setStatus(SessionStatus.PLANNED);
            sessionRepository.save(s);
            created++;
        }
        recalibrate(user);
        return created;
    }

    /**
     * Réattribue les focus des séances futures PLANNED (hors focus verrouillés à la main).
     *
     * Le focus d'une date est DÉTERMINISTE : k-ième jour d'entraînement de la semaine
     * → k-ième élément de la rotation. Conséquences voulues pour un groupe qui
     * s'entraîne ensemble :
     * - tous les membres avec les mêmes réglages voient la même séance chaque jour ;
     * - un férié supprime un jour pour tout le monde → toute l'équipe se décale pareil ;
     * - un skip/une absence individuelle ne décale RIEN : au retour, la séance du jour
     *   est déjà celle du groupe (recalage automatique).
     */
    @Transactional
    public void recalibrate(User user) {
        List<Focus> rotation = user.rotationList();
        if (rotation.isEmpty()) return;

        List<WorkoutSession> future = sessionRepository
                .findByUserAndStatusAndDateGreaterThanEqualOrderByDateAsc(
                        user, SessionStatus.PLANNED, LocalDate.now());
        for (WorkoutSession s : future) {
            if (s.isFocusLocked()) continue;
            s.setFocus(focusForDate(user, s.getDate()));
        }
        sessionRepository.saveAll(future);
    }

    /** Focus du jour selon la position parmi les jours d'entraînement de la semaine. */
    public Focus focusForDate(User user, LocalDate date) {
        List<Focus> rotation = user.rotationList();
        if (rotation.isEmpty()) return Focus.FULL_BODY;
        LocalDate monday = date
                .with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        int idx = 0;
        for (LocalDate d = monday; d.isBefore(date); d = d.plusDays(1)) {
            if (isEligibleDay(user, d)) idx++;
        }
        return rotation.get(idx % rotation.size());
    }

    /**
     * Focus par défaut d'une séance créée à la main.
     * Jour d'entraînement → la séance du groupe. Jour off (week-end, férié) →
     * rattrapage : le premier focus de la rotation pas encore validé cette semaine.
     */
    public Focus nextFocusFor(User user, LocalDate date) {
        List<Focus> rotation = user.rotationList();
        if (rotation.isEmpty()) return Focus.FULL_BODY;
        if (isEligibleDay(user, date)) return focusForDate(user, date);

        LocalDate monday = date
                .with(java.time.temporal.TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Set<Focus> done = sessionRepository
                .findByUserAndStatusAndDateBetween(user, SessionStatus.COMPLETED,
                        monday, monday.plusDays(6)).stream()
                .map(WorkoutSession::getFocus)
                .collect(Collectors.toSet());
        for (Focus f : rotation) {
            if (!done.contains(f)) return f;
        }
        return focusForDate(user, date);
    }

    /** Passe en MISSED les séances planifiées restées dans le passé. Retourne true si changement. */
    @Transactional
    public boolean sweepMissed(User user) {
        List<WorkoutSession> stale = sessionRepository
                .findByUserAndStatusAndDateBeforeOrderByDateAsc(user, SessionStatus.PLANNED, LocalDate.now());
        // une séance IN_PROGRESS d'hier reste modifiable : on ne touche qu'aux PLANNED.
        // Pas de recalibrage : une absence ne décale pas le reste de la semaine,
        // on reste calé sur le groupe.
        if (stale.isEmpty()) return false;
        stale.forEach(s -> s.setStatus(SessionStatus.MISSED));
        sessionRepository.saveAll(stale);
        return true;
    }

    @Transactional
    public List<PlanDayDto> calendar(User user, LocalDate from, LocalDate to) {
        if (to.isBefore(from) || from.plusMonths(4).isBefore(to)) {
            throw new IllegalArgumentException("Plage de dates invalide (max 4 mois)");
        }
        sweepMissed(user);

        Map<LocalDate, WorkoutSession> byDate = sessionRepository
                .findByUserAndDateBetweenOrderByDateAsc(user, from, to).stream()
                .collect(Collectors.toMap(WorkoutSession::getDate, Function.identity()));

        Set<DayOfWeek> trainingDays = new HashSet<>(user.trainingDaysList());
        List<PlanDayDto> days = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            String holidayName = FrenchHolidays.nameOf(d);
            WorkoutSession s = byDate.get(d);
            days.add(new PlanDayDto(d, trainingDays.contains(d.getDayOfWeek()),
                    holidayName != null, holidayName,
                    s != null ? SessionSummaryDto.from(s) : null));
        }
        return days;
    }

    /**
     * Streak : jours d'entraînement éligibles consécutifs honorés.
     * Les fériés et jours de repos ne cassent pas la série ; aujourd'hui non plus tant
     * que la séance n'est pas manquée.
     */
    public int currentStreak(User user) {
        if (user.trainingDaysList().isEmpty()) return 0;
        Set<LocalDate> completed = sessionRepository
                .findByUserAndStatusOrderByDateAsc(user, SessionStatus.COMPLETED).stream()
                .map(WorkoutSession::getDate)
                .collect(Collectors.toSet());
        if (completed.isEmpty()) return 0;

        int streak = 0;
        LocalDate today = LocalDate.now();
        LocalDate limit = today.minusYears(3);
        for (LocalDate d = today; d.isAfter(limit); d = d.minusDays(1)) {
            if (!isEligibleDay(user, d)) continue;
            if (completed.contains(d)) {
                streak++;
            } else if (!d.equals(today)) {
                break;
            }
        }
        return streak;
    }
}
