package com.chickenfitness.dto;

import com.chickenfitness.model.SetEntry;
import com.chickenfitness.model.WorkoutSession;
import com.chickenfitness.model.enums.Focus;
import com.chickenfitness.model.enums.SessionStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class SessionDtos {

    private SessionDtos() {}

    public record SetDto(Long id, Long exerciseId, String exerciseName, String exerciseType,
                         int setNumber, Integer reps, Double weightKg, Integer durationSec,
                         Double distanceM, Double e1rm, boolean pr) {
        public static SetDto from(SetEntry s, boolean pr) {
            return new SetDto(s.getId(), s.getExercise().getId(), s.getExercise().getName(),
                    s.getExercise().getType().name(), s.getSetNumber(), s.getReps(), s.getWeightKg(),
                    s.getDurationSec(), s.getDistanceM(), s.e1rm(), pr);
        }
    }

    /**
     * Meilleure perf passée sur un exercice + dernière perf + suggestion de charge
     * (pour affichage et pré-remplissage pendant la séance).
     */
    public record ExerciseBestDto(Double bestE1rm, Double bestWeightKg, Integer bestReps,
                                  Double lastWeightKg, Integer lastReps,
                                  Double suggestedWeightKg) {}

    public record SessionDetailDto(Long id, LocalDate date, String focus, String focusLabel,
                                   String focusEmoji, String status, String notes, Integer durationMin,
                                   Integer rpe, List<SetDto> sets,
                                   CatalogDtos.TemplateDto suggestedTemplate,
                                   Map<Long, ExerciseBestDto> bests) {}

    public record LogSetRequest(@NotNull Long exerciseId, Integer reps, Double weightKg,
                                Integer durationSec, Double distanceM) {}

    public record UpdateSessionRequest(SessionStatus status, Integer rpe, String notes,
                                       Integer durationMin, Focus focus) {}

    public static SessionSummary summary(WorkoutSession s) {
        return new SessionSummary(s.getId(), s.getDate(), s.getFocus().name(), s.getStatus().name());
    }

    public record SessionSummary(Long id, LocalDate date, String focus, String status) {}
}
