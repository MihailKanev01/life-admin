package com.lifeadmin.api.note;

import java.util.List;
import java.util.UUID;

import com.lifeadmin.api.security.UserPrincipal;
import com.lifeadmin.api.thing.Thing;
import com.lifeadmin.api.thing.ThingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NoteService {

    private final NoteRepository notes;
    private final ThingRepository things;

    public NoteService(NoteRepository notes, ThingRepository things) {
        this.notes = notes;
        this.things = things;
    }

    @Transactional(readOnly = true)
    public NoteDtos.NoteList list(UserPrincipal principal, UUID thingId) {
        if (thingId != null && things.findByIdAndUserIdAndArchivedFalse(thingId, principal.getId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Thing not found");
        }
        List<Note> result = thingId == null
                ? notes.findByUserIdOrderByUpdatedAtDesc(principal.getId())
                : notes.findByUserIdAndThingIdOrderByUpdatedAtDesc(principal.getId(), thingId);
        return new NoteDtos.NoteList(result.stream().map(this::response).toList());
    }

    @Transactional
    public NoteDtos.NoteResponse create(UserPrincipal principal, NoteDtos.CreateRequest request) {
        UUID thingId = request.thingId();
        if (thingId == null
                || things.findByIdAndUserIdAndArchivedFalse(thingId, principal.getId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Thing not found");
        }

        Note note = notes.save(new Note(
                principal.getId(),
                thingId,
                request.title().trim(),
                request.body().trim()));
        return response(note);
    }

    @Transactional
    public NoteDtos.NoteResponse update(UserPrincipal principal, UUID id, NoteDtos.UpdateRequest request) {
        Note note = owned(principal, id);
        note.update(request.title().trim(), request.body().trim());
        return response(note);
    }

    @Transactional
    public void delete(UserPrincipal principal, UUID id) {
        notes.delete(owned(principal, id));
    }

    @Transactional(readOnly = true)
    public Note owned(UserPrincipal principal, UUID id) {
        return notes.findByIdAndUserId(id, principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found"));
    }

    public NoteDtos.NoteResponse response(Note note) {
        String thingName = things.findById(note.getThingId())
                .filter(thing -> thing.getUserId().equals(note.getUserId()))
                .map(Thing::getName)
                .orElse(null);
        return new NoteDtos.NoteResponse(
                note.getId(),
                note.getTitle(),
                note.getBody(),
                note.getThingId(),
                thingName,
                note.getCreatedAt(),
                note.getUpdatedAt());
    }
}
