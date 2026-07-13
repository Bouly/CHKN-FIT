package com.chickenfitness.service;

import com.chickenfitness.model.ProgressPhoto;
import com.chickenfitness.model.User;
import com.chickenfitness.model.enums.PhotoAngle;
import com.chickenfitness.repository.ProgressPhotoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class PhotoService {

    private static final Map<String, String> ALLOWED = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/heic", ".heic");

    private final ProgressPhotoRepository photoRepository;
    private final Path uploadDir;

    public PhotoService(ProgressPhotoRepository photoRepository,
                        @Value("${app.upload-dir}") String uploadDir) {
        this.photoRepository = photoRepository;
        this.uploadDir = Path.of(uploadDir);
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new UncheckedIOException("Impossible de créer le dossier d'upload", e);
        }
    }

    public ProgressPhoto upload(User user, MultipartFile file, PhotoAngle angle,
                                LocalDate takenAt, Double weightKg) {
        String ext = ALLOWED.get(file.getContentType());
        if (ext == null) {
            throw new IllegalArgumentException("Format non supporté (jpeg, png, webp, heic uniquement)");
        }
        String filename = UUID.randomUUID() + ext;
        try {
            Files.copy(file.getInputStream(), uploadDir.resolve(filename),
                    StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("Échec de l'enregistrement du fichier", e);
        }
        ProgressPhoto photo = new ProgressPhoto();
        photo.setUser(user);
        photo.setTakenAt(takenAt != null ? takenAt : LocalDate.now());
        photo.setAngle(angle != null ? angle : PhotoAngle.FRONT);
        photo.setFilename(filename);
        photo.setContentType(file.getContentType());
        photo.setWeightKg(weightKg);
        return photoRepository.save(photo);
    }

    public List<ProgressPhoto> list(User user, PhotoAngle angle) {
        return angle == null
                ? photoRepository.findByUserOrderByTakenAtDesc(user)
                : photoRepository.findByUserAndAngleOrderByTakenAtDesc(user, angle);
    }

    public record PhotoFile(byte[] bytes, String contentType) {}

    public PhotoFile file(User user, Long photoId) {
        ProgressPhoto p = owned(user, photoId);
        try {
            return new PhotoFile(Files.readAllBytes(uploadDir.resolve(p.getFilename())),
                    p.getContentType() != null ? p.getContentType() : "image/jpeg");
        } catch (IOException e) {
            throw new NoSuchElementException("Fichier photo introuvable");
        }
    }

    public void delete(User user, Long photoId) {
        ProgressPhoto p = owned(user, photoId);
        try {
            Files.deleteIfExists(uploadDir.resolve(p.getFilename()));
        } catch (IOException ignored) {
            // l'entrée DB est supprimée quoi qu'il arrive
        }
        photoRepository.delete(p);
    }

    private ProgressPhoto owned(User user, Long photoId) {
        ProgressPhoto p = photoRepository.findById(photoId)
                .orElseThrow(() -> new NoSuchElementException("Photo introuvable"));
        if (!p.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Les photos de progression sont privées");
        }
        return p;
    }
}
