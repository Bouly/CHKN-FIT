package com.chickenfitness.web;

import com.chickenfitness.dto.AuthDtos.AuthResponse;
import com.chickenfitness.dto.AuthDtos.LoginRequest;
import com.chickenfitness.dto.AuthDtos.RegisterRequest;
import com.chickenfitness.dto.AuthDtos.UpdateProfileRequest;
import com.chickenfitness.dto.AuthDtos.UserDto;
import com.chickenfitness.model.User;
import com.chickenfitness.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal User user) {
        return UserDto.from(user);
    }

    @PutMapping("/me")
    public UserDto updateProfile(@AuthenticationPrincipal User user,
                                 @RequestBody UpdateProfileRequest req) {
        return authService.updateProfile(user, req);
    }

    @PostMapping("/password")
    public java.util.Map<String, String> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody com.chickenfitness.dto.AuthDtos.ChangePasswordRequest req) {
        authService.changePassword(user, req);
        return java.util.Map.of("status", "ok");
    }
}
