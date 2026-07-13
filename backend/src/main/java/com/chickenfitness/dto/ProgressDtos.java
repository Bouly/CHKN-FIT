package com.chickenfitness.dto;

import com.chickenfitness.model.Measurement;
import com.chickenfitness.model.ProgressPhoto;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public final class ProgressDtos {

    private ProgressDtos() {}

    public record PrDto(Long exerciseId, String exerciseName, Double weightKg, Integer reps,
                        Double e1rm, LocalDate date) {}

    public record DashboardDto(int streak, long totalCompleted, int attendanceRate30d,
                               PlanDtos.SessionSummaryDto todaySession, LocalDate todayDate,
                               boolean todayIsHoliday, String todayHolidayName,
                               LocalDate nextTrainingDate, List<PrDto> recentPrs,
                               Double currentWeightKg, Double weightDelta30d,
                               long photoCount, int weekCompletedCount, int weekPlannedCount) {}

    public record ExercisePointDto(LocalDate date, Double bestE1rm, Double topWeight, Double volume) {}

    public record VolumePointDto(LocalDate weekStart, double volume, int sessions) {}

    public record MeasurementDto(Long id, LocalDate date, Double weightKg, Double bodyFatPct,
                                 Double chestCm, Double waistCm, Double hipsCm, Double bicepCm,
                                 Double thighCm, String notes) {
        public static MeasurementDto from(Measurement m) {
            return new MeasurementDto(m.getId(), m.getDate(), m.getWeightKg(), m.getBodyFatPct(),
                    m.getChestCm(), m.getWaistCm(), m.getHipsCm(), m.getBicepCm(), m.getThighCm(),
                    m.getNotes());
        }
    }

    public record SaveMeasurementRequest(@NotNull LocalDate date, Double weightKg, Double bodyFatPct,
                                         Double chestCm, Double waistCm, Double hipsCm, Double bicepCm,
                                         Double thighCm, String notes) {}

    public record PhotoDto(Long id, LocalDate takenAt, String angle, String angleLabel, Double weightKg) {
        public static PhotoDto from(ProgressPhoto p) {
            return new PhotoDto(p.getId(), p.getTakenAt(), p.getAngle().name(),
                    p.getAngle().getLabel(), p.getWeightKg());
        }
    }
}
