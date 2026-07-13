package com.chickenfitness.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "set_entries")
@Getter
@Setter
@NoArgsConstructor
public class SetEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id")
    private WorkoutSession session;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "exercise_id")
    private Exercise exercise;

    private int setNumber;

    private Integer reps;

    private Double weightKg;

    private Integer durationSec;

    private Double distanceM;

    /**
     * 1RM estimé (formule d'Epley : poids * (1 + reps/30)).
     * Null pour les exercices sans charge.
     */
    public Double e1rm() {
        if (weightKg == null || reps == null || reps <= 0) return null;
        if (reps == 1) return weightKg;
        return weightKg * (1 + reps / 30.0);
    }
}
