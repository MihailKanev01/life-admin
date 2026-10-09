package com.lifeadmin.api.note;

import java.util.UUID;

import jakarta.validation.Valid;

import com.lifeadmin.api.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notes")
public class NoteController {

    private final NoteService notes;

    public NoteController(NoteService notes) {
        this.notes = notes;
    }

    @GetMapping
    public NoteDtos.NoteList list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID thingId) {
        return notes.list(principal, thingId);
    }

    @PostMapping
    public NoteDtos.NoteResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody NoteDtos.CreateRequest request) {
        return notes.create(principal, request);
    }

    @PatchMapping("/{id}")
    public NoteDtos.NoteResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody NoteDtos.UpdateRequest request) {
        return notes.update(principal, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        notes.delete(principal, id);
    }
}
