package com.chickenfitness.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * Anti brute-force minimal sur les endpoints d'authentification :
 * 10 tentatives par minute et par IP, en mémoire (suffisant pour une instance unique).
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_PER_MINUTE = 10;
    private static final long WINDOW_MS = 60_000;

    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI();
        boolean guarded = "POST".equals(request.getMethod())
                && (path.equals("/api/auth/login") || path.equals("/api/auth/register"));
        if (!guarded) {
            chain.doFilter(request, response);
            return;
        }

        long now = System.currentTimeMillis();
        Deque<Long> deque = hits.computeIfAbsent(clientIp(request), k -> new ConcurrentLinkedDeque<>());
        synchronized (deque) {
            while (!deque.isEmpty() && now - deque.peekFirst() > WINDOW_MS) {
                deque.pollFirst();
            }
            if (deque.size() >= MAX_PER_MINUTE) {
                response.setStatus(429);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"message\":\"Trop de tentatives, réessaie dans une minute\"}");
                return;
            }
            deque.addLast(now);
        }
        // purge opportuniste pour ne pas accumuler des IP mortes
        if (hits.size() > 10_000) hits.clear();

        chain.doFilter(request, response);
    }

    private static String clientIp(HttpServletRequest request) {
        String fwd = request.getHeader("X-Forwarded-For");
        if (fwd != null && !fwd.isBlank()) {
            return fwd.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
