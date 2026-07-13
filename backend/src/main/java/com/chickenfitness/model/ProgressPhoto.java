package com.chickenfitness.model;

import com.chickenfitness.model.enums.PhotoAngle;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "progress_photos")
@Getter
@Setter
@NoArgsConstructor
public class ProgressPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private LocalDate takenAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PhotoAngle angle = PhotoAngle.FRONT;

    /** Nom du fichier stocké dans app.upload-dir (jamais exposé directement) */
    @Column(nullable = false)
    private String filename;

    private String contentType;

    /** Poids du jour (kg), optionnel — pratique pour annoter la comparaison */
    private Double weightKg;
}
