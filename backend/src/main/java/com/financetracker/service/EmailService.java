package com.financetracker.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    // @Async means this runs in background thread
    // Main request returns immediately
    // Email sends without blocking the user
    @Async
    public void sendEmail(
            String to, String subject,
            String template,
            Map<String, Object> variables) {

        if (!mailEnabled) {
            log.info("Mail disabled. Would send '{}' to {}",
                subject, to);
            return;
        }

        try {
            // Build HTML from Thymeleaf template
            Context context = new Context();
            context.setVariables(variables);
            String htmlContent = templateEngine
                .process("emails/" + template, context);

            // Create email message
            MimeMessage message =
                mailSender.createMimeMessage();
            MimeMessageHelper helper =
                new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = HTML

            mailSender.send(message);
            log.info("Email sent: '{}' to {}", subject, to);

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}",
                to, e.getMessage());
            // Don't throw — email failure shouldn't
            // crash the main request
        }
    }

    // ─── Convenience methods ──────────────────────────

    public void sendWelcomeEmail(
            String to, String fullName) {
        sendEmail(to,
            "Welcome to Finance Tracker! 🎉",
            "welcome",
            Map.of("fullName", fullName));
    }

    public void sendBudgetExceededEmail(
            String to, String fullName,
            String category, String limitAmount,
            String spentAmount, String overAmount,
            String percentage, String month) {
        sendEmail(to,
            "🚨 Budget Alert: " + category +
            " budget exceeded",
            "budget-exceeded",
            Map.of(
                "fullName", fullName,
                "category", category,
                "limitAmount", limitAmount,
                "spentAmount", spentAmount,
                "overAmount", overAmount,
                "percentage", percentage,
                "month", month
            ));
    }

    public void sendMonthlyReport(
            String to, String fullName,
            String monthName, int year,
            String income, String expenses,
            String savings,
            java.util.List<Map<String, String>> budgets) {
        sendEmail(to,
            "📊 Your " + monthName +
            " Financial Report",
            "monthly-report",
            Map.of(
                "fullName", fullName,
                "monthName", monthName,
                "year", year,
                "income", income,
                "expenses", expenses,
                "savings", savings,
                "budgets", budgets
            ));
    }
}