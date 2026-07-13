package com.chickenfitness.service;

import com.chickenfitness.dto.AuthDtos.AuthResponse;
import com.chickenfitness.dto.AuthDtos.LoginRequest;
import com.chickenfitness.dto.AuthDtos.RegisterRequest;
import com.chickenfitness.dto.AuthDtos.UpdateProfileRequest;
import com.chickenfitness.dto.AuthDtos.UserDto;
import com.chickenfitness.model.User;
import com.chickenfitness.model.enums.Focus;
import com.chickenfitness.repository.UserRepository;
import com.chickenfitness.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PlanningService planningService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, PlanningService planningService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.planningService = planningService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new IllegalArgumentException("Un compte existe déjà avec cet email");
        }
        User user = new User();
        user.setEmail(req.email().toLowerCase().trim());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setDisplayName(req.displayName().trim());
        if (req.avatarEmoji() != null && !req.avatarEmoji().isBlank()) {
            user.setAvatarEmoji(req.avatarEmoji());
        }
        userRepository.save(user);
        // planning de départ : 4 semaines générées d'office
        planningService.generate(user, 4);
        return new AuthResponse(jwtService.generateToken(user.getEmail()), UserDto.from(user));
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> new IllegalArgumentException("Email ou mot de passe incorrect"));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Email ou mot de passe incorrect");
        }
        return new AuthResponse(jwtService.generateToken(user.getEmail()), UserDto.from(user));
    }

    @Transactional
    public UserDto updateProfile(User user, UpdateProfileRequest req) {
        if (req.displayName() != null && !req.displayName().isBlank()) {
            user.setDisplayName(req.displayName().trim());
        }
        if (req.avatarEmoji() != null && !req.avatarEmoji().isBlank()) {
            user.setAvatarEmoji(req.avatarEmoji());
        }
        if (req.heightCm() != null) user.setHeightCm(req.heightCm());
        if (req.birthDate() != null) user.setBirthDate(req.birthDate());
        if (req.goal() != null) user.setGoal(req.goal());

        boolean planChanged = false;
        if (req.trainingDays() != null && !req.trainingDays().isEmpty()) {
            String csv = req.trainingDays().stream()
                    .map(String::trim).map(String::toUpperCase)
                    .peek(DayOfWeek::valueOf) // valide
                    .collect(Collectors.joining(","));
            user.setTrainingDays(csv);
            planChanged = true;
        }
        if (req.rotation() != null && !req.rotation().isEmpty()) {
            String csv = req.rotation().stream()
                    .map(String::trim).map(String::toUpperCase)
                    .peek(Focus::valueOf) // valide
                    .collect(Collectors.joining(","));
            user.setRotation(csv);
            planChanged = true;
        }
        userRepository.save(user);
        if (planChanged) {
            planningService.recalibrate(user);
        }
        return UserDto.from(user);
    }
}
