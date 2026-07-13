package com.chickenfitness.model.enums;

public enum Focus {
    CHEST("Pecs", "Pectoraux", "🏋️"),
    BACK("Dos", "Dos : tractions et tirages", "🧗"),
    SHOULDERS("Épaules", "Deltoïdes, trapèzes", "🎯"),
    ARMS("Bras", "Biceps, triceps", "💪"),
    LEGS("Jambes", "Jambes, fessiers", "🦵"),
    PUSH("Push", "Pectoraux, épaules, triceps", "🏋️"),
    PULL("Pull", "Dos, biceps", "🧗"),
    FULL_BODY("Full Body", "Corps complet", "💪"),
    CARDIO("Cardio", "Endurance, course, vélo", "🏃"),
    HIIT("HIIT", "Fractionné haute intensité", "🔥"),
    MOBILITY("Mobilité", "Étirements, souplesse, récup", "🧘");

    private final String label;
    private final String description;
    private final String emoji;

    Focus(String label, String description, String emoji) {
        this.label = label;
        this.description = description;
        this.emoji = emoji;
    }

    public String getLabel() { return label; }
    public String getDescription() { return description; }
    public String getEmoji() { return emoji; }
}
