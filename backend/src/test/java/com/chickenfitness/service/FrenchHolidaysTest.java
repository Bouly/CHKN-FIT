package com.chickenfitness.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class FrenchHolidaysTest {

    @Test
    void easterSundayIsCorrectForKnownYears() {
        assertEquals(LocalDate.of(2024, 3, 31), FrenchHolidays.easterSunday(2024));
        assertEquals(LocalDate.of(2025, 4, 20), FrenchHolidays.easterSunday(2025));
        assertEquals(LocalDate.of(2026, 4, 5), FrenchHolidays.easterSunday(2026));
        assertEquals(LocalDate.of(2027, 3, 28), FrenchHolidays.easterSunday(2027));
    }

    @Test
    void year2026HasAllElevenHolidays() {
        Map<LocalDate, String> holidays = FrenchHolidays.forYear(2026);
        assertEquals(11, holidays.size());
        assertEquals("Fête nationale", holidays.get(LocalDate.of(2026, 7, 14)));
        assertEquals("Lundi de Pâques", holidays.get(LocalDate.of(2026, 4, 6)));
        assertEquals("Ascension", holidays.get(LocalDate.of(2026, 5, 14)));
        assertEquals("Lundi de Pentecôte", holidays.get(LocalDate.of(2026, 5, 25)));
        assertEquals("Noël", holidays.get(LocalDate.of(2026, 12, 25)));
    }

    @Test
    void ordinaryDayIsNotHoliday() {
        assertFalse(FrenchHolidays.isHoliday(LocalDate.of(2026, 7, 13)));
        assertTrue(FrenchHolidays.isHoliday(LocalDate.of(2026, 7, 14)));
    }
}
