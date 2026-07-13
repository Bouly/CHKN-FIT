package com.chickenfitness.repository;

import com.chickenfitness.model.Measurement;
import com.chickenfitness.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MeasurementRepository extends JpaRepository<Measurement, Long> {
    List<Measurement> findByUserOrderByDateAsc(User user);
    Optional<Measurement> findByUserAndDate(User user, LocalDate date);
    Optional<Measurement> findFirstByUserAndWeightKgIsNotNullOrderByDateDesc(User user);
    long countByUserAndDateBetween(User user, LocalDate from, LocalDate to);
}
