package com.lifeadmin.api.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.time.Duration;

import com.lifeadmin.api.domain.User;
import com.lifeadmin.api.security.UserPrincipal;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final SecurityContextRepository securityContextRepository;

    public AuthController(
            AuthService authService,
            SecurityContextRepository securityContextRepository) {
        this.authService = authService;
        this.securityContextRepository = securityContextRepository;
    }

    @GetMapping("/csrf")
    public AuthDtos.CsrfResponse csrf(CsrfToken token) {
        return new AuthDtos.CsrfResponse(token.getToken());
    }

    @PostMapping("/register")
    public AuthDtos.AuthResponse register(
            @Valid @RequestBody AuthDtos.RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        User user = authService.register(
                request.email(),
                request.password(),
                request.displayName(),
                request.timezone());

        establishAuthentication(user, httpRequest, httpResponse);
        return new AuthDtos.AuthResponse(authService.response(user));
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(
            @Valid @RequestBody AuthDtos.LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        User user = authService.authenticate(request.email(), request.password());

        establishAuthentication(user, httpRequest, httpResponse);
        return new AuthDtos.AuthResponse(authService.response(user));
    }

    @GetMapping("/me")
    public AuthDtos.AuthResponse me(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = authService.getCurrentUser(principal);
        return new AuthDtos.AuthResponse(authService.response(user));
    }

    @PatchMapping("/me/onboarding")
    public AuthDtos.AuthResponse completeOnboarding(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = authService.completeOnboarding(principal);
        return new AuthDtos.AuthResponse(authService.response(user));
    }

    @PostMapping("/password-reset/request")
    public AuthDtos.MessageResponse requestPasswordReset(
            @Valid @RequestBody AuthDtos.PasswordResetRequest request) {
        authService.requestPasswordReset(request.email());
        return new AuthDtos.MessageResponse(
                "If an account exists for that email, a password reset link will be sent.");
    }

    @PostMapping("/password-reset/confirm")
    public AuthDtos.MessageResponse confirmPasswordReset(
            @Valid @RequestBody AuthDtos.PasswordResetConfirmRequest request) {
        authService.confirmPasswordReset(request.token(), request.password());
        return new AuthDtos.MessageResponse("Your password has been updated. You can now sign in.");
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        ResponseCookie clearedCsrf = ResponseCookie.from("XSRF-TOKEN", "")
                .maxAge(Duration.ZERO)
                .path("/")
                .sameSite("Strict")
                .httpOnly(false)
                .secure(request.isSecure())
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, clearedCsrf.toString());
    }

    private void establishAuthentication(
            User user,
            HttpServletRequest request,
            HttpServletResponse response) {

        request.getSession(true);
        request.changeSessionId();

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authService.authentication(user));
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }
}
