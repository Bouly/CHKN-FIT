package com.chickenfitness.repository;

import com.chickenfitness.model.TeamSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamSettingsRepository extends JpaRepository<TeamSettings, Long> {
}
