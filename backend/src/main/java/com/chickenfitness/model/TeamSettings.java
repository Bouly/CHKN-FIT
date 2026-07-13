package com.chickenfitness.model;

import com.chickenfitness.model.enums.Focus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.util.Arrays;
import java.util.List;

/**
 * Le planning central de l'équipe (singleton, id = 1), géré par l'admin.
 * Les membres qui "suivent le planning d'équipe" utilisent ces réglages.
 */
@Entity
@Table(name = "team_settings")
@Getter
@Setter
@NoArgsConstructor
public class TeamSettings {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    @Column(nullable = false)
    private String trainingDays = "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY";

    @Column(nullable = false)
    private String rotation = "CHEST,BACK,SHOULDERS,ARMS,LEGS";

    public List<DayOfWeek> trainingDaysList() {
        return Arrays.stream(trainingDays.split(",")).map(String::trim)
                .filter(s -> !s.isEmpty()).map(DayOfWeek::valueOf).toList();
    }

    public List<Focus> rotationList() {
        return Arrays.stream(rotation.split(",")).map(String::trim)
                .filter(s -> !s.isEmpty()).map(Focus::valueOf).toList();
    }
}
