package com.chickenfitness.repository;

import com.chickenfitness.model.WorkoutTemplate;
import com.chickenfitness.model.enums.Focus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutTemplateRepository extends JpaRepository<WorkoutTemplate, Long> {
    List<WorkoutTemplate> findByFocus(Focus focus);
}
