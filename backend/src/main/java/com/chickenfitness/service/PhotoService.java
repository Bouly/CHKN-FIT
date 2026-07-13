package com.chickenfitness.service;

import com.chickenfitness.model.ProgressPhoto;
import com.chickenfitness.model.User;
import com.chickenfitness.model.enums.PhotoAngle;
import com.chickenfitness.repository.ProgressPhotoRepository;
import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;

@Service
public class PhotoService {

    private static final Set<String> ALLOWED = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/heic");
    private static final int MAX_DIMENSION = 1600;

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
        if (!ALLOWED.contains(file.getContentType())) {
            throw new IllegalArgumentException("Format non supporté (jpeg, png, webp, heic uniquement)");
        }
        byte[] original;
        try {
            original = file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Lecture du fichier impossible", e);
        }

        // compression + orientation EXIF ; si le format n'est pas décodable (heic), on garde l'original
        byte[] processed = compress(original);
        String ext = processed != null ? ".jpg" : extensionFor(file.getContentType());
        String contentType = processed != null ? "image/jpeg" : file.getContentType();
        byte[] toStore = processed != null ? processed : original;

        String filename = UUID.randomUUID() + ext;
        try {
            Files.write(uploadDir.resolve(filename), toStore);
        } catch (IOException e) {
            throw new UncheckedIOException("Échec de l'enregistrement du fichier", e);
        }
        ProgressPhoto photo = new ProgressPhoto();
        photo.setUser(user);
        photo.setTakenAt(takenAt != null ? takenAt : LocalDate.now());
        photo.setAngle(angle != null ? angle : PhotoAngle.FRONT);
        photo.setFilename(filename);
        photo.setContentType(contentType);
        photo.setWeightKg(weightKg);
        return photoRepository.save(photo);
    }

    /**
     * Redresse selon l'EXIF, limite à 1600 px et réencode en JPEG (qualité par défaut).
     * @return les octets JPEG, ou null si l'image n'est pas décodable par ImageIO.
     */
    private static byte[] compress(byte[] original) {
        try {
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(original));
            if (img == null) return null;

            img = applyExifOrientation(img, readOrientation(original));

            int w = img.getWidth(), h = img.getHeight();
            if (Math.max(w, h) > MAX_DIMENSION) {
                double scale = (double) MAX_DIMENSION / Math.max(w, h);
                int nw = (int) Math.round(w * scale), nh = (int) Math.round(h * scale);
                BufferedImage resized = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_RGB);
                Graphics2D g = resized.createGraphics();
                g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
                        RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                g.drawImage(img, 0, 0, nw, nh, null);
                g.dispose();
                img = resized;
            } else if (img.getType() != BufferedImage.TYPE_INT_RGB) {
                // JPEG n'accepte pas l'alpha
                BufferedImage rgb = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
                Graphics2D g = rgb.createGraphics();
                g.drawImage(img, 0, 0, null);
                g.dispose();
                img = rgb;
            }

            var out = new java.io.ByteArrayOutputStream();
            ImageIO.write(img, "jpg", out);
            byte[] jpeg = out.toByteArray();
            return jpeg.length > 0 ? jpeg : null;
        } catch (Exception e) {
            return null; // en cas de doute : original conservé
        }
    }

    private static int readOrientation(byte[] bytes) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(bytes));
            ExifIFD0Directory dir = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (dir != null && dir.containsTag(ExifIFD0Directory.TAG_ORIENTATION)) {
                return dir.getInt(ExifIFD0Directory.TAG_ORIENTATION);
            }
        } catch (Exception ignored) {
            // pas d'EXIF lisible
        }
        return 1;
    }

    private static BufferedImage applyExifOrientation(BufferedImage img, int orientation) {
        if (orientation == 1) return img;
        int w = img.getWidth(), h = img.getHeight();
        AffineTransform t = new AffineTransform();
        int nw = w, nh = h;
        switch (orientation) {
            case 3 -> { t.translate(w, h); t.rotate(Math.PI); }
            case 6 -> { nw = h; nh = w; t.translate(h, 0); t.rotate(Math.PI / 2); }
            case 8 -> { nw = h; nh = w; t.translate(0, w); t.rotate(-Math.PI / 2); }
            default -> { return img; }
        }
        BufferedImage rotated = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rotated.createGraphics();
        g.setTransform(t);
        g.drawImage(img, 0, 0, null);
        g.dispose();
        return rotated;
    }

    private static String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/heic" -> ".heic";
            default -> ".jpg";
        };
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
