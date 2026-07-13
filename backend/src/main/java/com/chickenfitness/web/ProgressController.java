package com.chickenfitness.web;

import com.chickenfitness.dto.ProgressDtos.DashboardDto;
import com.chickenfitness.dto.ProgressDtos.ExercisePointDto;
import com.chickenfitness.dto.ProgressDtos.MeasurementDto;
import com.chickenfitness.dto.ProgressDtos.PhotoDto;
import com.chickenfitness.dto.ProgressDtos.PrDto;
import com.chickenfitness.dto.ProgressDtos.SaveMeasurementRequest;
import com.chickenfitness.dto.ProgressDtos.VolumePointDto;
import com.chickenfitness.model.Measurement;
import com.chickenfitness.model.User;
import com.chickenfitness.model.enums.PhotoAngle;
import com.chickenfitness.repository.MeasurementRepository;
import com.chickenfitness.service.PhotoService;
import com.chickenfitness.service.StatsService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final StatsService statsService;
    private final PhotoService photoService;
    private final MeasurementRepository measurementRepository;

    public ProgressController(StatsService statsService, PhotoService photoService,
                              MeasurementRepository measurementRepository) {
        this.statsService = statsService;
        this.photoService = photoService;
        this.measurementRepository = measurementRepository;
    }

    @GetMapping("/dashboard")
    public DashboardDto dashboard(@AuthenticationPrincipal User user) {
        return statsService.dashboard(user);
    }

    @GetMapping("/exercise/{exerciseId}")
    public List<ExercisePointDto> exerciseProgress(@AuthenticationPrincipal User user,
                                                   @PathVariable Long exerciseId) {
        return statsService.exerciseProgress(user, exerciseId);
    }

    @GetMapping("/volume")
    public List<VolumePointDto> volume(@AuthenticationPrincipal User user,
                                       @RequestParam(defaultValue = "12") int weeks) {
        return statsService.weeklyVolume(user, Math.min(Math.max(weeks, 1), 52));
    }

    @GetMapping("/records")
    public List<PrDto> records(@AuthenticationPrincipal User user) {
        return statsService.currentRecords(user);
    }

    @GetMapping("/prs")
    public List<PrDto> prEvents(@AuthenticationPrincipal User user) {
        return statsService.prEvents(user);
    }

    /** Export CSV de toutes les séries validées (date;exercice;série;poids;reps;durée;distance;e1RM). */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCsv(@AuthenticationPrincipal User user) {
        String csv = statsService.exportCsv(user);
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv;charset=UTF-8")
                .header("Content-Disposition", "attachment; filename=\"chkn-fit-export.csv\"")
                .body(csv.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    // ---- Mensurations ----

    @GetMapping("/measurements")
    public List<MeasurementDto> measurements(@AuthenticationPrincipal User user) {
        return measurementRepository.findByUserOrderByDateAsc(user).stream()
                .map(MeasurementDto::from).toList();
    }

    @PostMapping("/measurements")
    public MeasurementDto saveMeasurement(@AuthenticationPrincipal User user,
                                          @Valid @RequestBody SaveMeasurementRequest req) {
        Measurement m = measurementRepository.findByUserAndDate(user, req.date())
                .orElseGet(() -> {
                    Measurement n = new Measurement();
                    n.setUser(user);
                    n.setDate(req.date());
                    return n;
                });
        m.setWeightKg(req.weightKg());
        m.setBodyFatPct(req.bodyFatPct());
        m.setChestCm(req.chestCm());
        m.setWaistCm(req.waistCm());
        m.setHipsCm(req.hipsCm());
        m.setBicepCm(req.bicepCm());
        m.setThighCm(req.thighCm());
        m.setNotes(req.notes());
        return MeasurementDto.from(measurementRepository.save(m));
    }

    @DeleteMapping("/measurements/{id}")
    public Map<String, String> deleteMeasurement(@AuthenticationPrincipal User user,
                                                 @PathVariable Long id) {
        Measurement m = measurementRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Mensuration introuvable"));
        if (!m.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Cette mensuration ne t'appartient pas");
        }
        measurementRepository.delete(m);
        return Map.of("status", "ok");
    }

    // ---- Photos de progression ----

    @PostMapping(value = "/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PhotoDto uploadPhoto(@AuthenticationPrincipal User user,
                                @RequestParam("file") MultipartFile file,
                                @RequestParam(required = false) PhotoAngle angle,
                                @RequestParam(required = false)
                                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate takenAt,
                                @RequestParam(required = false) Double weightKg) {
        return PhotoDto.from(photoService.upload(user, file, angle, takenAt, weightKg));
    }

    @GetMapping("/photos")
    public List<PhotoDto> photos(@AuthenticationPrincipal User user,
                                 @RequestParam(required = false) PhotoAngle angle) {
        return photoService.list(user, angle).stream().map(PhotoDto::from).toList();
    }

    @GetMapping("/photos/{id}/file")
    public ResponseEntity<byte[]> photoFile(@AuthenticationPrincipal User user, @PathVariable Long id) {
        PhotoService.PhotoFile f = photoService.file(user, id);
        return ResponseEntity.ok()
                .header("Content-Type", f.contentType())
                .header("Cache-Control", "private, max-age=86400")
                .body(f.bytes());
    }

    @DeleteMapping("/photos/{id}")
    public Map<String, String> deletePhoto(@AuthenticationPrincipal User user, @PathVariable Long id) {
        photoService.delete(user, id);
        return Map.of("status", "ok");
    }
}
