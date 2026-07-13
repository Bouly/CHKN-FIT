package com.chickenfitness.model.enums;

public enum MuscleGroup {
    CHEST("Pectoraux"),
    BACK("Dos"),
    SHOULDERS("Épaules"),
    BICEPS("Biceps"),
    TRICEPS("Triceps"),
    LEGS("Jambes"),
    GLUTES("Fessiers"),
    CORE("Abdos / Core"),
    FULL_BODY("Corps complet"),
    CARDIO("Cardio");

    private final String label;

    MuscleGroup(String label) { this.label = label; }

    public String getLabel() { return label; }
}
