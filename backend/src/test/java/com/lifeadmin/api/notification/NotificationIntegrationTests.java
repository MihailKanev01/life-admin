package com.lifeadmin.api.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import com.jayway.jsonpath.JsonPath;
import com.lifeadmin.api.domain.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ReminderNotificationRepository notifications;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository users;

    @MockitoBean
    private NotificationEmailSender emailSender;

    @Test
    void schedulesEmailNotificationsAtNineInTheUsersTimezone() throws Exception {
        LocalDate dueDate = LocalDate.of(2027, 10, 14);
        ReminderFixture fixture = createReminder(dueDate);

        List<ReminderNotification> scheduled = notifications
                .findByReminderIdOrderByScheduledAtAsc(fixture.reminderId());

        assertThat(scheduled).hasSize(3);
        assertThat(scheduled)
                .extracting(ReminderNotification::getDaysBeforeDue)
                .containsExactly(7, 2, 0);
        assertThat(scheduled)
                .extracting(ReminderNotification::getStatus)
                .containsOnly(ReminderNotification.SCHEDULED);

        ZoneId zone = ZoneId.of("Europe/Sofia");
        for (ReminderNotification notification : scheduled) {
            Instant expected = dueDate.minusDays(notification.getDaysBeforeDue())
                    .atTime(LocalTime.of(9, 0))
                    .atZone(zone)
                    .toInstant();
            assertThat(notification.getScheduledAt()).isEqualTo(expected);
            assertThat(notification.getUserId()).isEqualTo(fixture.userId());
            assertThat(notification.getChannel()).isEqualTo(ReminderNotification.EMAIL);
        }
    }

    @Test
    void reschedulingReplacesPendingNotificationsAndCompletingCancelsThem() throws Exception {
        ReminderFixture fixture = createReminder(LocalDate.of(2027, 10, 14));

        mockMvc.perform(patch("/api/v1/reminders/" + fixture.reminderId())
                        .with(csrf())
                        .session(fixture.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Updated service",
                                  "context":"Mazda 6",
                                  "dueDate":"2027-11-04",
                                  "thingId":null
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value("2027-11-04"));

        List<ReminderNotification> afterReschedule = notifications
                .findByReminderIdOrderByScheduledAtAsc(fixture.reminderId());
        assertThat(afterReschedule).hasSize(6);
        assertThat(afterReschedule)
                .filteredOn(item -> ReminderNotification.CANCELLED.equals(item.getStatus()))
                .hasSize(3);
        assertThat(afterReschedule)
                .filteredOn(item -> ReminderNotification.SCHEDULED.equals(item.getStatus()))
                .hasSize(3);

        mockMvc.perform(post("/api/v1/reminders/" + fixture.reminderId() + "/complete")
                        .with(csrf())
                        .session(fixture.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        assertThat(notifications.findByReminderIdOrderByScheduledAtAsc(fixture.reminderId()))
                .extracting(ReminderNotification::getStatus)
                .containsOnly(ReminderNotification.CANCELLED);
    }

    @Test
    void deliveryMarksNotificationSentAndDoesNotSendItTwice() throws Exception {
        ReminderFixture fixture = createReminder(LocalDate.of(2027, 6, 14));
        ReminderNotification first = notifications
                .findByReminderIdOrderByScheduledAtAsc(fixture.reminderId())
                .getFirst();
        Instant deliveryTime = first.getScheduledAt().plusSeconds(30);

        assertThat(notificationService.processDueNotifications(deliveryTime)).isEqualTo(1);

        ReminderNotification delivered = notifications.findById(first.getId()).orElseThrow();
        assertThat(delivered.getStatus()).isEqualTo(ReminderNotification.SENT);
        assertThat(delivered.getSentAt()).isEqualTo(deliveryTime);
        verify(emailSender).sendReminder(
                fixture.email(),
                "Notifications User",
                "Car service",
                "Mazda 6",
                LocalDate.of(2027, 6, 14),
                7);

        assertThat(notificationService.processDueNotifications(deliveryTime.plusSeconds(1))).isZero();
        verifyNoMoreInteractions(emailSender);
    }

    @Test
    void failedEmailIsRetriedWithBackoffWithoutPersistingProviderErrorText() throws Exception {
        ReminderFixture fixture = createReminder(LocalDate.of(2027, 6, 14));
        ReminderNotification first = notifications
                .findByReminderIdOrderByScheduledAtAsc(fixture.reminderId())
                .getFirst();
        Instant deliveryTime = first.getScheduledAt().plusSeconds(30);
        doThrow(new IllegalStateException("secret@example.test provider response"))
                .when(emailSender)
                .sendReminder(anyString(), anyString(), anyString(), anyString(), any(LocalDate.class), eq(7));

        assertThat(notificationService.processDueNotifications(deliveryTime)).isEqualTo(1);

        ReminderNotification failedAttempt = notifications.findById(first.getId()).orElseThrow();
        assertThat(failedAttempt.getStatus()).isEqualTo(ReminderNotification.SCHEDULED);
        assertThat(failedAttempt.getAttemptCount()).isEqualTo(1);
        assertThat(failedAttempt.getNextAttemptAt()).isEqualTo(deliveryTime.plusSeconds(300));
        assertThat(failedAttempt.getLastError()).isEqualTo("IllegalStateException");
        assertThat(failedAttempt.getLastError()).doesNotContain("secret@example.test");

        assertThat(notificationService.processDueNotifications(deliveryTime.plusSeconds(31))).isZero();

        assertThat(notificationService.processDueNotifications(failedAttempt.getNextAttemptAt())).isEqualTo(1);
        ReminderNotification secondAttempt = notifications.findById(first.getId()).orElseThrow();
        assertThat(secondAttempt.getAttemptCount()).isEqualTo(2);
        assertThat(secondAttempt.getStatus()).isEqualTo(ReminderNotification.SCHEDULED);

        assertThat(notificationService.processDueNotifications(secondAttempt.getNextAttemptAt())).isEqualTo(1);
        ReminderNotification finalAttempt = notifications.findById(first.getId()).orElseThrow();
        assertThat(finalAttempt.getAttemptCount()).isEqualTo(3);
        assertThat(finalAttempt.getStatus()).isEqualTo(ReminderNotification.FAILED);

        verify(emailSender, org.mockito.Mockito.times(3)).sendReminder(
                fixture.email(),
                "Notifications User",
                "Car service",
                "Mazda 6",
                LocalDate.of(2027, 6, 14),
                7);
        verifyNoMoreInteractions(emailSender);
    }

    private ReminderFixture createReminder(LocalDate dueDate) throws Exception {
        String email = "notification-" + UUID.randomUUID() + "@example.com";
        MvcResult register = mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"LifeAdmin-Test-2026!",
                                  "displayName":"Notifications User",
                                  "timezone":"Europe/Sofia"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession session = (MockHttpSession) register.getRequest().getSession(false);
        UUID userId = users.findByEmail(email)
                .map(user -> user.getId())
                .orElseThrow(() -> new AssertionError("Registered user was not persisted"));

        MvcResult created = mockMvc.perform(post("/api/v1/reminders")
                        .with(csrf())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Car service",
                                  "context":"Mazda 6",
                                  "dueDate":"%s"
                                }
                                """.formatted(dueDate)))
                .andExpect(status().isOk())
                .andReturn();
        String reminderId = JsonPath.read(created.getResponse().getContentAsString(), "$.id");
        return new ReminderFixture(
                session, email, userId, UUID.fromString(reminderId));
    }

    private record ReminderFixture(
            MockHttpSession session, String email, UUID userId, UUID reminderId) {}
}
