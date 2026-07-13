package com.chickenfitness.config;

import com.chickenfitness.model.Exercise;
import com.chickenfitness.model.TemplateExercise;
import com.chickenfitness.model.WorkoutTemplate;
import com.chickenfitness.model.enums.ExerciseType;
import com.chickenfitness.model.enums.Focus;
import com.chickenfitness.model.enums.MuscleGroup;
import com.chickenfitness.repository.ExerciseRepository;
import com.chickenfitness.repository.WorkoutTemplateRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import static com.chickenfitness.model.enums.ExerciseType.*;
import static com.chickenfitness.model.enums.MuscleGroup.*;

/**
 * Bibliothèque d'exercices + séances types. Idempotent : chaque exercice est créé
 * s'il n'existe pas (par nom), chaque programme s'il n'existe pas (par focus) —
 * une instance existante récupère donc les nouveaux programmes au redémarrage.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final ExerciseRepository exerciseRepository;
    private final WorkoutTemplateRepository templateRepository;
    private final com.chickenfitness.repository.TeamSettingsRepository teamSettingsRepository;
    private final Map<String, Exercise> byName = new HashMap<>();

    public DataSeeder(ExerciseRepository exerciseRepository,
                      WorkoutTemplateRepository templateRepository,
                      com.chickenfitness.repository.TeamSettingsRepository teamSettingsRepository) {
        this.exerciseRepository = exerciseRepository;
        this.templateRepository = templateRepository;
        this.teamSettingsRepository = teamSettingsRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // planning central de l'équipe (singleton)
        if (teamSettingsRepository.findById(com.chickenfitness.model.TeamSettings.SINGLETON_ID).isEmpty()) {
            teamSettingsRepository.save(new com.chickenfitness.model.TeamSettings());
        }

        // --- Pecs ---
        ex("Développé couché", CHEST, STRENGTH);
        ex("Développé incliné haltères", CHEST, STRENGTH);
        ex("Écarté poulie", CHEST, STRENGTH);
        ex("Pompes", CHEST, BODYWEIGHT);

        // --- Dos ---
        ex("Tractions", MuscleGroup.BACK, BODYWEIGHT);
        ex("Rowing barre", MuscleGroup.BACK, STRENGTH);
        ex("Tirage vertical", MuscleGroup.BACK, STRENGTH);
        ex("Tirage horizontal", MuscleGroup.BACK, STRENGTH);

        // --- Épaules ---
        ex("Développé militaire", SHOULDERS, STRENGTH);
        ex("Élévations latérales", SHOULDERS, STRENGTH);
        ex("Oiseau", SHOULDERS, STRENGTH);
        ex("Face pull", SHOULDERS, STRENGTH);
        ex("Shrugs", SHOULDERS, STRENGTH);

        // --- Bras ---
        ex("Curl biceps barre", BICEPS, STRENGTH);
        ex("Curl haltères", BICEPS, STRENGTH);
        ex("Curl marteau", BICEPS, STRENGTH);
        ex("Extensions triceps poulie", TRICEPS, STRENGTH);
        ex("Barre au front", TRICEPS, STRENGTH);
        ex("Dips", TRICEPS, BODYWEIGHT);

        // --- Jambes ---
        ex("Squat", LEGS, STRENGTH);
        ex("Soulevé de terre", LEGS, STRENGTH);
        ex("Presse à cuisses", LEGS, STRENGTH);
        ex("Fentes", LEGS, STRENGTH);
        ex("Leg curl", LEGS, STRENGTH);
        ex("Leg extension", LEGS, STRENGTH);
        ex("Mollets debout", LEGS, STRENGTH);
        ex("Hip thrust", GLUTES, STRENGTH);

        // --- Core ---
        ex("Planche", CORE, TIMED);
        ex("Gainage latéral", CORE, TIMED);
        ex("Crunch", CORE, BODYWEIGHT);
        ex("Relevés de jambes", CORE, BODYWEIGHT);
        ex("Russian twists", CORE, BODYWEIGHT);

        // --- Cardio / Full body ---
        ex("Course tapis", MuscleGroup.CARDIO, ExerciseType.CARDIO);
        ex("Vélo", MuscleGroup.CARDIO, ExerciseType.CARDIO);
        ex("Rameur", MuscleGroup.CARDIO, ExerciseType.CARDIO);
        ex("Corde à sauter", MuscleGroup.CARDIO, TIMED);
        ex("Burpees", FULL_BODY, BODYWEIGHT);
        ex("Mountain climbers", FULL_BODY, BODYWEIGHT);
        ex("Kettlebell swing", FULL_BODY, STRENGTH);
        ex("Thruster", FULL_BODY, STRENGTH);

        // --- Le split de la semaine ---
        template("Pecs", Focus.CHEST,
                "La séance du lundi : poitrine complète.",
                te("Développé couché", 4, "6-8", 120),
                te("Développé incliné haltères", 3, "8-12", 90),
                te("Écarté poulie", 3, "12-15", 60),
                te("Pompes", 3, "max", 60));

        template("Dos", Focus.BACK,
                "La séance du mardi : largeur et épaisseur.",
                te("Tractions", 4, "max", 120),
                te("Rowing barre", 4, "8-10", 90),
                te("Tirage vertical", 3, "10-12", 90),
                te("Tirage horizontal", 3, "10-12", 75));

        template("Épaules", Focus.SHOULDERS,
                "La séance du mercredi : les trois faisceaux + trapèzes.",
                te("Développé militaire", 4, "6-8", 120),
                te("Élévations latérales", 4, "12-15", 60),
                te("Oiseau", 3, "12-15", 60),
                te("Face pull", 3, "15", 60),
                te("Shrugs", 3, "12", 60));

        template("Bras", Focus.ARMS,
                "La séance du jeudi : biceps et triceps en alternance.",
                te("Curl biceps barre", 4, "8-12", 75),
                te("Extensions triceps poulie", 4, "10-12", 75),
                te("Curl marteau", 3, "10-12", 60),
                te("Barre au front", 3, "10-12", 75),
                te("Dips", 3, "max", 90));

        template("Jambes", Focus.LEGS,
                "La séance du vendredi : on ne saute JAMAIS le leg day.",
                te("Squat", 4, "6-8", 150),
                te("Presse à cuisses", 3, "10-12", 90),
                te("Fentes", 3, "10/jambe", 90),
                te("Leg curl", 3, "12", 60),
                te("Mollets debout", 4, "15", 45));

        // --- Alternatives ---
        template("Push", Focus.PUSH,
                "Pectoraux, épaules, triceps en une séance.",
                te("Développé couché", 4, "6-8", 120),
                te("Développé militaire", 3, "8-10", 90),
                te("Élévations latérales", 3, "12-15", 60),
                te("Extensions triceps poulie", 3, "10-12", 60));

        template("Pull", Focus.PULL,
                "Dos et biceps en une séance.",
                te("Tractions", 4, "max", 120),
                te("Rowing barre", 4, "8-10", 90),
                te("Curl biceps barre", 3, "8-12", 60),
                te("Face pull", 3, "15", 60));

        template("Full Body express", Focus.FULL_BODY,
                "Tout le corps en 45 minutes, parfait pour la pause déj.",
                te("Squat", 3, "8", 90),
                te("Développé couché", 3, "8", 90),
                te("Rowing barre", 3, "8", 90),
                te("Planche", 3, "45 s", 45));

        template("Cardio", Focus.CARDIO,
                "Endurance : choisis ta machine et fais-la chauffer.",
                te("Course tapis", 1, "20 min", 0),
                te("Rameur", 1, "10 min", 60),
                te("Vélo", 1, "10 min", 0));

        template("HIIT", Focus.HIIT,
                "30 minutes de fractionné. Ça pique, mais ça paye.",
                te("Burpees", 4, "15", 45),
                te("Mountain climbers", 4, "30", 45),
                te("Kettlebell swing", 4, "15", 45),
                te("Corde à sauter", 4, "60 s", 45));

        template("Mobilité", Focus.MOBILITY,
                "Récupération active : gainage léger et étirements.",
                te("Planche", 3, "30 s", 30),
                te("Gainage latéral", 2, "30 s/côté", 30),
                te("Crunch", 3, "15", 30));
    }

    private void ex(String name, MuscleGroup group, ExerciseType type) {
        Exercise e = exerciseRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> exerciseRepository.save(new Exercise(name, group, type, null, true)));
        byName.put(name, e);
    }

    private record TE(String exercise, int sets, String reps, int rest) {}

    private static TE te(String exercise, int sets, String reps, int rest) {
        return new TE(exercise, sets, reps, rest);
    }

    private void template(String name, Focus focus, String description, TE... exercises) {
        if (!templateRepository.findByFocus(focus).isEmpty()) return;
        WorkoutTemplate t = new WorkoutTemplate();
        t.setName(name);
        t.setFocus(focus);
        t.setDescription(description);
        t.setBuiltin(true);
        int pos = 0;
        for (TE spec : exercises) {
            TemplateExercise te = new TemplateExercise();
            te.setTemplate(t);
            te.setExercise(byName.get(spec.exercise()));
            te.setSets(spec.sets());
            te.setTargetReps(spec.reps());
            te.setRestSeconds(spec.rest());
            te.setPosition(pos++);
            t.getExercises().add(te);
        }
        templateRepository.save(t);
    }
}
