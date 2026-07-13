package com.chickenfitness.service;

import com.chickenfitness.dto.AuthDtos.AuthResponse;
import com.chickenfitness.dto.AuthDtos.ChangePasswordRequest;
import com.chickenfitness.dto.AuthDtos.LoginRequest;
import com.chickenfitness.dto.AuthDtos.RegisterRequest;
import com.chickenfitness.dto.AuthDtos.UpdateProfileRequest;
import com.chickenfitness.dto.AuthDtos.UserDto;
import com.chickenfitness.model.User;
import com.chickenfitness.model.enums.Focus;
import com.chickenfitness.model.enums.Role;
import com.chickenfitness.repository.UserRepository;
import com.chickenfitness.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
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
    private final String inviteCode;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, PlanningService planningService,
                       @Value("${app.invite-code}") String inviteCode) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.planningService = planningService;
        this.inviteCode = inviteCode;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (inviteCode != null && !inviteCode.isBlank()
                && !inviteCode.equals(req.inviteCode() != null ? req.inviteCode().trim() : "")) {
            throw new IllegalArgumentException("Code d'invitation invalide");
        }
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
        // le premier inscrit de l'instance administre le planning d'équipe et les membres
        if (userRepository.count() == 0) {
            user.setRole(Role.ADMIN);
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
    public void changePassword(User user, ChangePasswordRequest req) {
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Mot de passe actuel incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
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
            user.setFollowTeamPlan(false); // réglage perso => on quitte le planning d'équipe
            planChanged = true;
        }
        if (req.rotation() != null && !req.rotation().isEmpty()) {
            String csv = req.rotation().stream()
                    .map(String::trim).map(String::toUpperCase)
                    .peek(Focus::valueOf) // valide
                    .collect(Collectors.joining(","));
            user.setRotation(csv);
            user.setFollowTeamPlan(false);
            planChanged = true;
        }
        if (Boolean.TRUE.equals(req.followTeamPlan()) && !user.isFollowTeamPlan()) {
            user.setFollowTeamPlan(true); // retour au planning d'équipe
            planChanged = true;
        }
        userRepository.save(user);
        if (planChanged) {
            planningService.recalibrate(user);
        }
        return UserDto.from(user);
    }
}
