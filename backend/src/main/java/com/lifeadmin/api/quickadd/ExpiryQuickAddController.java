package com.lifeadmin.api.quickadd;

import jakarta.validation.Valid;

import com.lifeadmin.api.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/quick-add")
public class ExpiryQuickAddController {

    private final ExpiryQuickAddService quickAdd;

    public ExpiryQuickAddController(ExpiryQuickAddService quickAdd) {
        this.quickAdd = quickAdd;
    }

    @PostMapping("/expiry")
    public ExpiryQuickAddDtos.Response captureExpiry(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ExpiryQuickAddDtos.Request request) {
        return quickAdd.capture(principal, request);
    }
}
