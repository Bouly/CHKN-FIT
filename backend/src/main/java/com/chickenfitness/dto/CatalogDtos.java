package com.chickenfitness.dto;

import com.chickenfitness.model.Exercise;
import com.chickenfitness.model.TemplateExercise;
import com.chickenfitness.model.WorkoutTemplate;
import com.chickenfitness.model.enums.ExerciseType;
import com.chickenfitness.model.enums.Focus;
import com.chickenfitness.model.enums.MuscleGroup;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public final class CatalogDtos {

    private CatalogDtos() {}

    public record ExerciseDto(Long id, String name, String muscleGroup, String muscleGroupLabel,
                              String type, String description, boolean builtin) {
        public static ExerciseDto from(Exercise e) {
            return new ExerciseDto(e.getId(), e.getName(), e.getMuscleGroup().name(),
                    e.getMuscleGroup().getLabel(), e.getType().name(), e.getDescription(), e.isBuiltin());
        }
    }

    public record CreateExerciseRequest(
            @NotBlank String name,
            @NotNull MuscleGroup muscleGroup,
            @NotNull ExerciseType type,
            String description) {}

    public record TemplateExerciseDto(Long id, ExerciseDto exercise, int sets, String targetReps, int restSeconds) {
        public static TemplateExerciseDto from(TemplateExercise te) {
            return new TemplateExerciseDto(te.getId(), ExerciseDto.from(te.getExercise()),
                    te.getSets(), te.getTargetReps(), te.getRestSeconds());
        }
    }

    public record TemplateDto(Long id, String name, String focus, String focusLabel, String focusEmoji,
                              String description, boolean builtin, List<TemplateExerciseDto> exercises) {
        public static TemplateDto from(WorkoutTemplate t) {
            return new TemplateDto(t.getId(), t.getName(), t.getFocus().name(), t.getFocus().getLabel(),
                    t.getFocus().getEmoji(), t.getDescription(), t.isBuiltin(),
                    t.getExercises().stream().map(TemplateExerciseDto::from).toList());
        }
    }

    public record CreateTemplateExercise(@NotNull Long exerciseId, int sets, String targetReps, int restSeconds) {}

    public record CreateTemplateRequest(
            @NotBlank String name,
            @NotNull Focus focus,
            String description,
            List<CreateTemplateExercise> exercises) {}
}
