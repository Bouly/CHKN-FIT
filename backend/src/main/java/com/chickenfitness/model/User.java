package com.chickenfitness.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import com.chickenfitness.model.enums.Focus;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String displayName;

    private String avatarEmoji = "🐔";

    private Integer heightCm;

    private LocalDate birthDate;

    @Column(length = 500)
    private String goal;

    /** Jours d'entraînement, CSV de DayOfWeek (ex: "MONDAY,TUESDAY,..."). */
    @Column(nullable = false)
    private String trainingDays = "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY";

    /** Rotation des séances, CSV de Focus. Ancrée sur la semaine : lundi = premier élément. */
    @Column(nullable = false)
    private String rotation = "CHEST,BACK,SHOULDERS,ARMS,LEGS";

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public List<DayOfWeek> trainingDaysList() {
        return Arrays.stream(trainingDays.split(",")).map(String::trim)
                .filter(s -> !s.isEmpty()).map(DayOfWeek::valueOf).toList();
    }

    public List<Focus> rotationList() {
        return Arrays.stream(rotation.split(",")).map(String::trim)
                .filter(s -> !s.isEmpty()).map(Focus::valueOf).toList();
    }
}
