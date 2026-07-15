package com.chickenfitness.service;

import com.chickenfitness.dto.CatalogDtos.TemplateDto;
import com.chickenfitness.dto.SessionDtos.ExerciseBestDto;
import com.chickenfitness.dto.SessionDtos.LogSetRequest;
import com.chickenfitness.dto.SessionDtos.SessionDetailDto;
import com.chickenfitness.dto.SessionDtos.SetDto;
import com.chickenfitness.dto.SessionDtos.UpdateSessionRequest;
import com.chickenfitness.model.Exercise;
import com.chickenfitness.model.SetEntry;
import com.chickenfitness.model.User;
import com.chickenfitness.model.WorkoutSession;
import com.chickenfitness.model.enums.Focus;
import com.chickenfitness.model.enums.SessionStatus;
import com.chickenfitness.repository.ExerciseRepository;
import com.chickenfitness.repository.SetEntryRepository;
import com.chickenfitness.repository.WorkoutSessionRepository;
import com.chickenfitness.repository.WorkoutTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;

@Service
public class SessionService {

    private final WorkoutSessionRepository sessionRepository;
    private final SetEntryRepository setEntryRepository;
    private final ExerciseRepository exerciseRepository;
    private final WorkoutTemplateRepository templateRepository;
    private final PlanningService planningService;

    public SessionService(WorkoutSessionRepository sessionRepository,
                          SetEntryRepository setEntryRepository,
                          ExerciseRepository exerciseRepository,
                          WorkoutTemplateRepository templateRepository,
                          PlanningService planningService) {
        this.sessionRepository = sessionRepository;
        this.setEntryRepository = setEntryRepository;
        this.exerciseRepository = exerciseRepository;
        this.templateRepository = templateRepository;
        this.planningService = planningService;
    }

    private WorkoutSession owned(User user, Long sessionId) {
        WorkoutSession s = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Séance introuvable"));
        if (!s.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Cette séance ne t'appartient pas");
        }
        return s;
    }

    @Transactional(readOnly = true)
    public SessionDetailDto getDetail(User user, Long sessionId) {
        WorkoutSession s = owned(user, sessionId);
        return toDetail(user, s);
    }

    @Transactional
    public SessionDetailDto createAdhoc(User user, LocalDate date, Focus focus) {
        LocalDate d = date != null ? date : LocalDate.now();
        var existing = sessionRepository.findByUserAndDate(user, d);
        if (existing.isPresent()) return toDetail(user, existing.get());

        Focus f = focus != null ? focus : planningService.nextFocusFor(user, d);
        WorkoutSession s = new WorkoutSession();
        s.setUser(user);
        s.setDate(d);
        s.setFocus(f);
        s.setStatus(SessionStatus.PLANNED);
        sessionRepository.save(s);
        return toDetail(user, s);
    }

    @Transactional
    public SessionDetailDto update(User user, Long sessionId, UpdateSessionRequest req) {
        WorkoutSession s = owned(user, sessionId);
        if (req.status() != null && req.status() != s.getStatus()) {
            s.setStatus(req.status());
            // pas de recalibrage : un skip/une validation ne décale pas la semaine,
            // chacun reste calé sur la séance du groupe
        }
        if (req.focus() != null && req.focus() != s.getFocus()) {
            s.setFocus(req.focus());
            s.setFocusLocked(true); // choix manuel : le recalibrage ne l'écrase plus
        }
        if (req.rpe() != null) s.setRpe(Math.min(10, Math.max(1, req.rpe())));
        if (req.notes() != null) s.setNotes(req.notes());
        if (req.durationMin() != null) s.setDurationMin(req.durationMin());
        if (req.hiddenExerciseIds() != null) {
            s.setHiddenExercises(WorkoutSession.idsToCsv(req.hiddenExerciseIds()));
        }
        if (req.addedExerciseIds() != null) {
            s.setAddedExercises(WorkoutSession.idsToCsv(req.addedExerciseIds()));
        }
        sessionRepository.save(s);
        return toDetail(user, s);
    }

    /** Supprime une séance (créée par erreur, doublon...). Les séries loggées partent avec. */
    @Transactional
    public void delete(User user, Long sessionId) {
        WorkoutSession s = owned(user, sessionId);
        sessionRepository.delete(s);
    }

    @Transactional
    public SetDto logSet(User user, Long sessionId, LogSetRequest req) {
        WorkoutSession s = owned(user, sessionId);
        Exercise ex = exerciseRepository.findById(req.exerciseId())
                .orElseThrow(() -> new NoSuchElementException("Exercice introuvable"));

        if (s.getStatus() == SessionStatus.PLANNED || s.getStatus() == SessionStatus.MISSED
                || s.getStatus() == SessionStatus.SKIPPED) {
            s.setStatus(SessionStatus.IN_PROGRESS);
        }

        // record à battre : calculé AVANT d'ajouter la nouvelle série
        // (historique complété + séries déjà loggées de cette séance)
        Double best = historicalBest(user, ex.getId(), s.getId());
        for (SetEntry other : s.getSets()) {
            if (!other.getExercise().getId().equals(ex.getId())) continue;
            Double e = other.e1rm();
            if (e != null && (best == null || e > best)) best = e;
        }

        int setNumber = (int) s.getSets().stream()
                .filter(e -> e.getExercise().getId().equals(ex.getId())).count() + 1;

        SetEntry entry = new SetEntry();
        entry.setSession(s);
        entry.setExercise(ex);
        entry.setSetNumber(setNumber);
        entry.setReps(req.reps());
        entry.setWeightKg(req.weightKg());
        entry.setDurationSec(req.durationSec());
        entry.setDistanceM(req.distanceM());
        SetEntry saved = setEntryRepository.save(entry);
        s.getSets().add(saved);
        sessionRepository.save(s);

        Double e1rm = saved.e1rm();
        boolean pr = e1rm != null && (best == null || e1rm > best + 0.001);
        return SetDto.from(saved, pr);
    }

    @Transactional
    public void deleteSet(User user, Long sessionId, Long setId) {
        WorkoutSession s = owned(user, sessionId);
        boolean removed = s.getSets().removeIf(e -> e.getId().equals(setId));
        if (!removed) throw new NoSuchElementException("Série introuvable");
        // renuméroter les séries par exercice
        Map<Long, Integer> counters = new HashMap<>();
        for (SetEntry e : s.getSets()) {
            int n = counters.merge(e.getExercise().getId(), 1, Integer::sum);
            e.setSetNumber(n);
        }
        sessionRepository.save(s);
    }

    /** Meilleur e1RM historique sur un exercice, hors séance courante. */
    private Double historicalBest(User user, Long exerciseId, Long excludeSessionId) {
        Double best = null;
        for (SetEntry e : setEntryRepository.findCompletedByUserAndExercise(user.getId(), exerciseId)) {
            if (e.getSession().getId().equals(excludeSessionId)) continue;
            Double v = e.e1rm();
            if (v != null && (best == null || v > best)) best = v;
        }
        return best;
    }

    private SessionDetailDto toDetail(User user, WorkoutSession s) {
        TemplateDto suggested = templateRepository.findByFocus(s.getFocus()).stream()
                .findFirst().map(TemplateDto::from).orElse(null);

        // exercices concernés : template suggéré + ajoutés à la séance + déjà loggés
        Set<Long> exerciseIds = new HashSet<>();
        if (suggested != null) suggested.exercises().forEach(te -> exerciseIds.add(te.exercise().id()));
        exerciseIds.addAll(s.addedExerciseIdList());
        s.getSets().forEach(e -> exerciseIds.add(e.getExercise().getId()));

        Map<Long, ExerciseBestDto> bests = new HashMap<>();
        for (Long exId : exerciseIds) {
            Double bestE1rm = null, bestWeight = null, lastWeight = null;
            Integer bestReps = null, lastReps = null, lastRpe = null;
            for (SetEntry e : setEntryRepository.findCompletedByUserAndExercise(user.getId(), exId)) {
                if (e.getSession().getId().equals(s.getId())) continue;
                Double v = e.e1rm();
                if (v != null && (bestE1rm == null || v > bestE1rm)) {
                    bestE1rm = v;
                    bestWeight = e.getWeightKg();
                    bestReps = e.getReps();
                }
                if (e.getWeightKg() != null || e.getReps() != null) {
                    lastWeight = e.getWeightKg();
                    lastReps = e.getReps();
                    lastRpe = e.getSession().getRpe();
                }
            }
            if (bestE1rm != null || lastWeight != null || lastReps != null) {
                bests.put(exId, new ExerciseBestDto(round1(bestE1rm), bestWeight, bestReps,
                        lastWeight, lastReps, suggestWeight(lastWeight, lastReps, lastRpe)));
            }
        }

        // flags PR : on rejoue la séance dans l'ordre en partant du meilleur historique
        Map<Long, Double> running = new HashMap<>();
        bests.forEach((exId, b) -> running.put(exId, b.bestE1rm()));
        List<SetDto> setDtos = new ArrayList<>();
        for (SetEntry e : s.getSets()) {
            Long exId = e.getExercise().getId();
            Double e1rm = e.e1rm();
            Double best = running.get(exId);
            boolean pr = e1rm != null && (best == null || e1rm > best + 0.001);
            if (pr) running.put(exId, e1rm);
            setDtos.add(SetDto.from(e, pr));
        }

        return new SessionDetailDto(s.getId(), s.getDate(), s.getFocus().name(),
                s.getFocus().getLabel(), s.getFocus().getEmoji(), s.getStatus().name(),
                s.getNotes(), s.getDurationMin(), s.getRpe(), setDtos, suggested, bests,
                s.hiddenExerciseIdList(), s.addedExerciseIdList());
    }

    /**
     * Suggestion de charge : si la dernière perf était confortable
     * (≥ 10 reps, ou ≥ 8 reps avec un RPE de séance ≤ 7), on propose +2,5 kg.
     * Sinon, on reprend la dernière charge.
     */
    private static Double suggestWeight(Double lastWeight, Integer lastReps, Integer lastRpe) {
        if (lastWeight == null || lastReps == null) return null;
        boolean easy = lastReps >= 10 || (lastRpe != null && lastRpe <= 7 && lastReps >= 8);
        return easy ? lastWeight + 2.5 : lastWeight;
    }

    private static Double round1(Double v) {
        return v == null ? null : Math.round(v * 10) / 10.0;
    }
}
