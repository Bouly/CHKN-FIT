package com.chickenfitness.service;

import com.chickenfitness.model.User;
import com.chickenfitness.model.WorkoutSession;
import com.chickenfitness.model.enums.SessionStatus;
import com.chickenfitness.repository.UserRepository;
import com.chickenfitness.repository.WorkoutSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Rappel de séance sur un webhook Slack / Teams (format {"text": "..."}).
 * Désactivé si WEBHOOK_URL n'est pas renseigné. Cron configurable (REMINDER_CRON),
 * par défaut 11 h 45 du lundi au vendredi, heure de Paris.
 */
@Service
public class ReminderService {

    private static final Logger log = LoggerFactory.getLogger(ReminderService.class);

    private final UserRepository userRepository;
    private final WorkoutSessionRepository sessionRepository;
    private final String webhookUrl;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();

    public ReminderService(UserRepository userRepository,
                           WorkoutSessionRepository sessionRepository,
                           @Value("${app.webhook-url}") String webhookUrl) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.webhookUrl = webhookUrl;
    }

    @Scheduled(cron = "${app.reminder-cron}", zone = "Europe/Paris")
    public void lunchReminder() {
        if (webhookUrl == null || webhookUrl.isBlank()) return;

        LocalDate today = LocalDate.now();
        String holiday = FrenchHolidays.nameOf(today);
        if (holiday != null) return; // férié : pas de séance, pas de spam

        List<String> lines = new ArrayList<>();
        for (User u : userRepository.findAll()) {
            Optional<WorkoutSession> s = sessionRepository.findByUserAndDate(u, today);
            if (s.isPresent() && (s.get().getStatus() == SessionStatus.PLANNED
                    || s.get().getStatus() == SessionStatus.IN_PROGRESS)) {
                lines.add(u.getDisplayName() + " → " + s.get().getFocus().getLabel());
            }
        }
        if (lines.isEmpty()) return;

        String text = "💪 CHKN-FIT — séance du midi dans 15 minutes !\n" + String.join("\n", lines);
        send(text);
    }

    void send(String text) {
        try {
            String json = "{\"text\":\"" + text.replace("\\", "\\\\")
                    .replace("\"", "\\\"").replace("\n", "\\n") + "\"}";
            HttpRequest req = HttpRequest.newBuilder(URI.create(webhookUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .timeout(Duration.ofSeconds(10))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() >= 300) {
                log.warn("Webhook rappel : HTTP {}", res.statusCode());
            }
        } catch (Exception e) {
            log.warn("Webhook rappel indisponible : {}", e.getMessage());
        }
    }
}
