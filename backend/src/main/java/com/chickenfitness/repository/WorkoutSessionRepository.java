package com.chickenfitness.repository;

import com.chickenfitness.model.User;
import com.chickenfitness.model.WorkoutSession;
import com.chickenfitness.model.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, Long> {

    List<WorkoutSession> findByUserAndDateBetweenOrderByDateAsc(User user, LocalDate from, LocalDate to);

    Optional<WorkoutSession> findByUserAndDate(User user, LocalDate date);

    List<WorkoutSession> findByUserAndStatusAndDateBeforeOrderByDateAsc(User user, SessionStatus status, LocalDate before);

    List<WorkoutSession> findByUserAndStatusAndDateGreaterThanEqualOrderByDateAsc(User user, SessionStatus status, LocalDate from);

    Optional<WorkoutSession> findFirstByUserAndStatusOrderByDateDesc(User user, SessionStatus status);

    List<WorkoutSession> findByUserAndStatusOrderByDateAsc(User user, SessionStatus status);

    List<WorkoutSession> findByUserAndStatusAndDateBetween(User user, SessionStatus status, LocalDate from, LocalDate to);

    long countByUserAndStatus(User user, SessionStatus status);

    List<WorkoutSession> findByDateAndStatusIn(LocalDate date, List<SessionStatus> statuses);

    List<WorkoutSession> findTop30ByStatusOrderByDateDescIdDesc(SessionStatus status);

    Optional<WorkoutSession> findFirstByUserAndStatusAndDateGreaterThanEqualOrderByDateAsc(User user, SessionStatus status, LocalDate from);
}
