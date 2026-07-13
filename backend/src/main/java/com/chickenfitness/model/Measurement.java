package com.chickenfitness.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "measurements",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "measure_date"}))
@Getter
@Setter
@NoArgsConstructor
public class Measurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "measure_date", nullable = false)
    private LocalDate date;

    private Double weightKg;
    private Double bodyFatPct;
    private Double chestCm;
    private Double waistCm;
    private Double hipsCm;
    private Double bicepCm;
    private Double thighCm;

    @Column(length = 500)
    private String notes;
}
