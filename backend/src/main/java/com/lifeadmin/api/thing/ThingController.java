package com.lifeadmin.api.thing;

import java.util.UUID;

import jakarta.validation.Valid;

import com.lifeadmin.api.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/things")
public class ThingController {

    private final ThingService things;

    public ThingController(ThingService things) {
        this.things = things;
    }

    @GetMapping
    public ThingDtos.ThingList list(@AuthenticationPrincipal UserPrincipal principal) {
        return new ThingDtos.ThingList(
                things.list(principal).stream().map(things::response).toList());
    }

    @GetMapping("/{id}")
    public ThingDtos.ThingResponse get(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return things.response(things.get(principal, id));
    }

    @PatchMapping("/{id}")
    public ThingDtos.ThingResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ThingDtos.UpdateRequest request) {
        return things.response(things.update(principal, id, request));
    }

    @PostMapping("/{id}/archive")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void archive(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        things.archive(principal, id);
    }

    @PostMapping
    public ThingDtos.ThingResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ThingDtos.CreateRequest request) {
        return things.response(things.create(principal, request));
    }
}
