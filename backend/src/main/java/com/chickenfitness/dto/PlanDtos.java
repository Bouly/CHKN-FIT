package com.chickenfitness.dto;

import com.chickenfitness.model.WorkoutSession;
import com.chickenfitness.model.enums.Focus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;

public final class PlanDtos {

    private PlanDtos() {}

    public record SessionSummaryDto(Long id, String focus, String focusLabel, String focusEmoji,
                                    String status, int setCount, Integer durationMin, Integer rpe) {
        public static SessionSummaryDto from(WorkoutSession s) {
            return new SessionSummaryDto(s.getId(), s.getFocus().name(), s.getFocus().getLabel(),
                    s.getFocus().getEmoji(), s.getStatus().name(), s.getSets().size(),
                    s.getDurationMin(), s.getRpe());
        }
    }

    public record PlanDayDto(LocalDate date, boolean trainingDay, boolean holiday, String holidayName,
                             SessionSummaryDto session) {}

    public record GenerateRequest(@Min(1) @Max(26) int weeks) {}

    public record TeamTodayDto(Long userId, String displayName, String avatarEmoji,
                               String status, String focus, String focusEmoji) {}

    public record CreateAdhocRequest(LocalDate date, Focus focus) {}
}
