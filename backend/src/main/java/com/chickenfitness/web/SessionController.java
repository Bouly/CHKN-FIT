package com.chickenfitness.web;

import com.chickenfitness.dto.PlanDtos.CreateAdhocRequest;
import com.chickenfitness.dto.SessionDtos.LogSetRequest;
import com.chickenfitness.dto.SessionDtos.SessionDetailDto;
import com.chickenfitness.dto.SessionDtos.SetDto;
import com.chickenfitness.dto.SessionDtos.UpdateSessionRequest;
import com.chickenfitness.model.User;
import com.chickenfitness.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping("/{id}")
    public SessionDetailDto get(@AuthenticationPrincipal User user, @PathVariable Long id) {
        return sessionService.getDetail(user, id);
    }

    @PostMapping("/adhoc")
    public SessionDetailDto createAdhoc(@AuthenticationPrincipal User user,
                                        @RequestBody(required = false) CreateAdhocRequest req) {
        return sessionService.createAdhoc(user,
                req != null ? req.date() : null,
                req != null ? req.focus() : null);
    }

    @PatchMapping("/{id}")
    public SessionDetailDto update(@AuthenticationPrincipal User user, @PathVariable Long id,
                                   @RequestBody UpdateSessionRequest req) {
        return sessionService.update(user, id, req);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        sessionService.delete(user, id);
        return Map.of("status", "ok");
    }

    @PostMapping("/{id}/sets")
    public SetDto logSet(@AuthenticationPrincipal User user, @PathVariable Long id,
                         @Valid @RequestBody LogSetRequest req) {
        return sessionService.logSet(user, id, req);
    }

    @DeleteMapping("/{id}/sets/{setId}")
    public Map<String, String> deleteSet(@AuthenticationPrincipal User user,
                                         @PathVariable Long id, @PathVariable Long setId) {
        sessionService.deleteSet(user, id, setId);
        return Map.of("status", "ok");
    }
}
