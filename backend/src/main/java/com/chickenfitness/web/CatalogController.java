package com.chickenfitness.web;

import com.chickenfitness.dto.CatalogDtos.CreateExerciseRequest;
import com.chickenfitness.dto.CatalogDtos.CreateTemplateRequest;
import com.chickenfitness.dto.CatalogDtos.ExerciseDto;
import com.chickenfitness.dto.CatalogDtos.TemplateDto;
import com.chickenfitness.model.Exercise;
import com.chickenfitness.model.TemplateExercise;
import com.chickenfitness.model.WorkoutTemplate;
import com.chickenfitness.repository.ExerciseRepository;
import com.chickenfitness.repository.WorkoutTemplateRepository;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {

    private final ExerciseRepository exerciseRepository;
    private final WorkoutTemplateRepository templateRepository;

    public CatalogController(ExerciseRepository exerciseRepository,
                             WorkoutTemplateRepository templateRepository) {
        this.exerciseRepository = exerciseRepository;
        this.templateRepository = templateRepository;
    }

    @GetMapping("/exercises")
    public List<ExerciseDto> exercises() {
        return exerciseRepository.findAll().stream()
                .sorted(Comparator.comparing(e -> e.getMuscleGroup().name()))
                .map(ExerciseDto::from).toList();
    }

    @PostMapping("/exercises")
    public ExerciseDto createExercise(@Valid @RequestBody CreateExerciseRequest req) {
        exerciseRepository.findByNameIgnoreCase(req.name()).ifPresent(e -> {
            throw new IllegalArgumentException("Un exercice porte déjà ce nom");
        });
        Exercise e = new Exercise(req.name().trim(), req.muscleGroup(), req.type(),
                req.description(), false);
        return ExerciseDto.from(exerciseRepository.save(e));
    }

    @GetMapping("/templates")
    @Transactional(readOnly = true)
    public List<TemplateDto> templates() {
        return templateRepository.findAll().stream().map(TemplateDto::from).toList();
    }

    @PostMapping("/templates")
    @Transactional
    public TemplateDto createTemplate(@Valid @RequestBody CreateTemplateRequest req) {
        WorkoutTemplate t = new WorkoutTemplate();
        t.setName(req.name().trim());
        t.setFocus(req.focus());
        t.setDescription(req.description());
        int pos = 0;
        if (req.exercises() != null) {
            for (var ce : req.exercises()) {
                Exercise ex = exerciseRepository.findById(ce.exerciseId())
                        .orElseThrow(() -> new NoSuchElementException("Exercice introuvable : " + ce.exerciseId()));
                TemplateExercise te = new TemplateExercise();
                te.setTemplate(t);
                te.setExercise(ex);
                te.setSets(ce.sets() > 0 ? ce.sets() : 3);
                te.setTargetReps(ce.targetReps() != null ? ce.targetReps() : "8-12");
                te.setRestSeconds(ce.restSeconds() > 0 ? ce.restSeconds() : 90);
                te.setPosition(pos++);
                t.getExercises().add(te);
            }
        }
        return TemplateDto.from(templateRepository.save(t));
    }
}
