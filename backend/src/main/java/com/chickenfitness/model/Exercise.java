package com.chickenfitness.model;

import com.chickenfitness.model.enums.ExerciseType;
import com.chickenfitness.model.enums.MuscleGroup;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@NoArgsConstructor
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MuscleGroup muscleGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExerciseType type;

    @Column(length = 500)
    private String description;

    /** true = exercice fourni par l'app, false = créé par un utilisateur */
    private boolean builtin = false;

    public Exercise(String name, MuscleGroup muscleGroup, ExerciseType type, String description, boolean builtin) {
        this.name = name;
        this.muscleGroup = muscleGroup;
        this.type = type;
        this.description = description;
        this.builtin = builtin;
    }
}
