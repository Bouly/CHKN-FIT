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
