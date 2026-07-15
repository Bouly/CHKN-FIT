package com.chickenfitness.model;

import com.chickenfitness.model.enums.Focus;
import com.chickenfitness.model.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workout_sessions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "session_date"}))
@Getter
@Setter
@NoArgsConstructor
public class WorkoutSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "session_date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Focus focus;

    /** true = focus choisi à la main : le recalibrage automatique ne l'écrase pas. */
    @Column(nullable = false, columnDefinition = "boolean default false not null")
    private boolean focusLocked = false;

    /** Exos du programme retirés pour CETTE séance (ids CSV). */
    @Column(length = 1000)
    private String hiddenExercises;

    /** Exos ajoutés à CETTE séance (ids CSV) — persistés même sans série loggée. */
    @Column(length = 1000)
    private String addedExercises;

    public java.util.List<Long> hiddenExerciseIdList() {
        return csvToIds(hiddenExercises);
    }

    public java.util.List<Long> addedExerciseIdList() {
        return csvToIds(addedExercises);
    }

    private static java.util.List<Long> csvToIds(String csv) {
        if (csv == null || csv.isBlank()) return java.util.List.of();
        return java.util.Arrays.stream(csv.split(",")).map(String::trim)
                .filter(s -> !s.isEmpty()).map(Long::valueOf).toList();
    }

    public static String idsToCsv(java.util.List<Long> ids) {
        if (ids == null || ids.isEmpty()) return null;
        return ids.stream().distinct().map(String::valueOf)
                .collect(java.util.stream.Collectors.joining(","));
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.PLANNED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private WorkoutTemplate template;

    @Column(length = 1000)
    private String notes;

    private Integer durationMin;

    /** Ressenti 1-10 (RPE de la séance) */
    private Integer rpe;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id ASC")
    private List<SetEntry> sets = new ArrayList<>();
}
