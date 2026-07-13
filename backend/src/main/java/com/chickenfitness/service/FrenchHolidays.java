package com.chickenfitness.service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Jours fériés France métropolitaine, calculés (aucune API externe).
 * Les fêtes mobiles dérivent du dimanche de Pâques (algorithme de Meeus/Jones/Butcher).
 */
public final class FrenchHolidays {

    private static final Map<Integer, Map<LocalDate, String>> CACHE = new ConcurrentHashMap<>();

    private FrenchHolidays() {}

    public static Map<LocalDate, String> forYear(int year) {
        return CACHE.computeIfAbsent(year, FrenchHolidays::compute);
    }

    public static String nameOf(LocalDate date) {
        return forYear(date.getYear()).get(date);
    }

    public static boolean isHoliday(LocalDate date) {
        return forYear(date.getYear()).containsKey(date);
    }

    private static Map<LocalDate, String> compute(int year) {
        LocalDate easter = easterSunday(year);
        Map<LocalDate, String> map = new LinkedHashMap<>();
        map.put(LocalDate.of(year, 1, 1), "Jour de l'an");
        map.put(easter.plusDays(1), "Lundi de Pâques");
        map.put(LocalDate.of(year, 5, 1), "Fête du Travail");
        map.put(LocalDate.of(year, 5, 8), "Victoire 1945");
        map.put(easter.plusDays(39), "Ascension");
        map.put(easter.plusDays(50), "Lundi de Pentecôte");
        map.put(LocalDate.of(year, 7, 14), "Fête nationale");
        map.put(LocalDate.of(year, 8, 15), "Assomption");
        map.put(LocalDate.of(year, 11, 1), "Toussaint");
        map.put(LocalDate.of(year, 11, 11), "Armistice 1918");
        map.put(LocalDate.of(year, 12, 25), "Noël");
        return map;
    }

    /** Algorithme de Meeus/Jones/Butcher (calendrier grégorien). */
    static LocalDate easterSunday(int year) {
        int a = year % 19;
        int b = year / 100;
        int c = year % 100;
        int d = b / 4;
        int e = b % 4;
        int f = (b + 8) / 25;
        int g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4;
        int k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;
        int month = (h + l - 7 * m + 114) / 31;
        int day = ((h + l - 7 * m + 114) % 31) + 1;
        return LocalDate.of(year, month, day);
    }
}
