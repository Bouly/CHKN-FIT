package com.chickenfitness.repository;

import com.chickenfitness.model.ProgressPhoto;
import com.chickenfitness.model.User;
import com.chickenfitness.model.enums.PhotoAngle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ProgressPhotoRepository extends JpaRepository<ProgressPhoto, Long> {
    List<ProgressPhoto> findByUserOrderByTakenAtDesc(User user);
    List<ProgressPhoto> findByUserAndAngleOrderByTakenAtDesc(User user, PhotoAngle angle);
    long countByUser(User user);
    long countByUserAndTakenAtBetween(User user, LocalDate from, LocalDate to);
}
