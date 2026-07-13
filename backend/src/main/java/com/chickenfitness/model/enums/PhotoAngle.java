package com.chickenfitness.model.enums;

public enum PhotoAngle {
    FRONT("Face"),
    SIDE("Profil"),
    BACK("Dos");

    private final String label;

    PhotoAngle(String label) { this.label = label; }

    public String getLabel() { return label; }
}
