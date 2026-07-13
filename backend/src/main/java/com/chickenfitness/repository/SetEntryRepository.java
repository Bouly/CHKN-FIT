package com.chickenfitness.repository;

import com.chickenfitness.model.SetEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface SetEntryRepository extends JpaRepository<SetEntry, Long> {

    @Query("""
            select s from SetEntry s
            join fetch s.session sess
            where sess.user.id = :userId and s.exercise.id = :exerciseId
              and sess.status = com.chickenfitness.model.enums.SessionStatus.COMPLETED
            order by sess.date asc, s.id asc
            """)
    List<SetEntry> findCompletedByUserAndExercise(@Param("userId") Long userId, @Param("exerciseId") Long exerciseId);

    @Query("""
            select s from SetEntry s
            join fetch s.session sess
            where sess.user.id = :userId
              and sess.status = com.chickenfitness.model.enums.SessionStatus.COMPLETED
            order by sess.date asc, s.id asc
            """)
    List<SetEntry> findAllCompletedByUser(@Param("userId") Long userId);

    @Query("""
            select s from SetEntry s
            join fetch s.session sess
            where sess.user.id = :userId
              and sess.status = com.chickenfitness.model.enums.SessionStatus.COMPLETED
              and sess.date between :from and :to
            order by sess.date asc, s.id asc
            """)
    List<SetEntry> findCompletedByUserBetween(@Param("userId") Long userId,
                                              @Param("from") LocalDate from,
                                              @Param("to") LocalDate to);
}
