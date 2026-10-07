package com.lifeadmin.api.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import com.lifeadmin.api.domain.User;
import com.lifeadmin.api.security.UserPrincipal;
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

        httpRequest.changeSessionId();
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

    @PostMapping("/logout")
    public void logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    private void establishAuthentication(
            User user,
            HttpServletRequest request,
            HttpServletResponse response) {

        request.getSession(true);\n        request.changeSessionId();

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authService.authentication(user));
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }
}
