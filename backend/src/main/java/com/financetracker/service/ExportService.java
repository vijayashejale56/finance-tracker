package com.financetracker.service;

import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder
            .getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow();
    }

    // Get all transactions for export (no pagination)
    @Transactional(readOnly = true)
    private List<Transaction> getTransactions(
            LocalDate from, LocalDate to) {
        User user = getCurrentUser();
        return transactionRepository.findByFilters(
            user.getId(), null, null, null,
            from, to, null, null, null,
            PageRequest.of(0, 10000)
        ).getContent();
    }

    // ─── CSV Export ───────────────────────────────────
    @Transactional(readOnly = true)
    public byte[] exportToCsv(
            LocalDate from, LocalDate to) throws Exception {

        List<Transaction> transactions =
            getTransactions(from, to);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        
        CSVWriter writer = new CSVWriter(
            new OutputStreamWriter(out));

        // Header row
        writer.writeNext(new String[]{
            "Date", "Type", "Category", "Description",
            "Account", "Amount", "Currency", "Status"
        });

        // Data rows
        DateTimeFormatter fmt =
            DateTimeFormatter.ofPattern("dd-MM-yyyy");

        for (Transaction t : transactions) {
            writer.writeNext(new String[]{
                t.getTransactionDate().format(fmt),
                t.getType().toUpperCase(),
                t.getCategory() != null
                    ? t.getCategory() : "",
                t.getDescription() != null
                    ? t.getDescription() : "",
                t.getAccount().getName(),
                t.getAmount().toString(),
                t.getCurrency(),
                t.getStatus()
            });
        }

        writer.close();
        log.info("CSV exported: {} transactions",
            transactions.size());
        return out.toByteArray();
    }

    // ─── PDF Export ───────────────────────────────────
    @Transactional(readOnly = true)
    public byte[] exportToPdf(
            LocalDate from, LocalDate to) throws Exception {

        List<Transaction> transactions =
            getTransactions(from, to);
        User user = getCurrentUser();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, out);
        document.open();

        // ── Fonts ──────────────────────────────────
        Font titleFont = new Font(
            Font.FontFamily.HELVETICA, 20,
            Font.BOLD, new BaseColor(79, 70, 229));
        Font headerFont = new Font(
            Font.FontFamily.HELVETICA, 10,
            Font.BOLD, BaseColor.WHITE);
        Font normalFont = new Font(
            Font.FontFamily.HELVETICA, 9,
            Font.NORMAL, BaseColor.DARK_GRAY);
        Font boldFont = new Font(
            Font.FontFamily.HELVETICA, 9,
            Font.BOLD, BaseColor.BLACK);
        Font subTitleFont = new Font(
            Font.FontFamily.HELVETICA, 11,
            Font.BOLD, BaseColor.DARK_GRAY);

        // ── Title ──────────────────────────────────
        Paragraph title = new Paragraph(
            "Finance Tracker — Transaction Report",
            titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(5);
        document.add(title);

        // ── Subtitle ───────────────────────────────
        DateTimeFormatter dateFmt =
            DateTimeFormatter.ofPattern("dd MMM yyyy");
        String period = from != null && to != null
            ? from.format(dateFmt) + " to " +
              to.format(dateFmt)
            : "All time";

        Paragraph subtitle = new Paragraph(
            user.getFullName() + " · " + period,
            subTitleFont);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        subtitle.setSpacingAfter(15);
        document.add(subtitle);

        // ── Summary Box ────────────────────────────
        BigDecimal totalIncome = transactions.stream()
            .filter(t -> t.getType().equals("income"))
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = transactions.stream()
            .filter(t -> t.getType().equals("expense"))
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netSavings =
            totalIncome.subtract(totalExpense);

        PdfPTable summaryTable = new PdfPTable(3);
        summaryTable.setWidthPercentage(100);
        summaryTable.setSpacingAfter(15);

        addSummaryCell(summaryTable, "Total Income",
            "₹" + totalIncome.toPlainString(),
            new BaseColor(220, 252, 231),
            new BaseColor(22, 101, 52));
        addSummaryCell(summaryTable, "Total Expenses",
            "₹" + totalExpense.toPlainString(),
            new BaseColor(254, 226, 226),
            new BaseColor(153, 27, 27));
        addSummaryCell(summaryTable, "Net Savings",
            "₹" + netSavings.toPlainString(),
            new BaseColor(224, 231, 255),
            new BaseColor(55, 48, 163));

        document.add(summaryTable);

        // ── Transactions Table ──────────────────────
        Paragraph tableTitle = new Paragraph(
            "Transaction Details (" +
            transactions.size() + " transactions)",
            subTitleFont);
        tableTitle.setSpacingAfter(8);
        document.add(tableTitle);

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{
            2f, 1.5f, 1.5f, 2.5f, 2f, 1.5f});

        // Table headers
        String[] headers = {
            "Date", "Type", "Category",
            "Description", "Account", "Amount"
        };
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(
                new Phrase(h, headerFont));
            cell.setBackgroundColor(
                new BaseColor(79, 70, 229));
            cell.setPadding(6);
            cell.setHorizontalAlignment(
                Element.ALIGN_CENTER);
            table.addCell(cell);
        }

        // Table rows
        DateTimeFormatter rowFmt =
            DateTimeFormatter.ofPattern("dd/MM/yy");
        boolean alternate = false;

        for (Transaction t : transactions) {
            BaseColor rowColor = alternate
                ? new BaseColor(249, 250, 251)
                : BaseColor.WHITE;
            alternate = !alternate;

            // Determine amount color
            BaseColor amtColor = t.getType()
                .equals("income")
                ? new BaseColor(22, 101, 52)
                : t.getType().equals("expense")
                ? new BaseColor(153, 27, 27)
                : new BaseColor(30, 64, 175);

            Font amtFont = new Font(
                Font.FontFamily.HELVETICA, 9,
                Font.BOLD, amtColor);

            String prefix = t.getType().equals("income")
                ? "+" : t.getType().equals("expense")
                ? "-" : "";

            addTableCell(table,
                t.getTransactionDate().format(rowFmt),
                normalFont, rowColor);
            addTableCell(table,
                t.getType().toUpperCase(),
                boldFont, rowColor);
            addTableCell(table,
                t.getCategory() != null
                    ? t.getCategory() : "-",
                normalFont, rowColor);
            addTableCell(table,
                t.getDescription() != null
                    ? t.getDescription() : "-",
                normalFont, rowColor);
            addTableCell(table,
                t.getAccount().getName(),
                normalFont, rowColor);
            addTableCell(table,
                prefix + "₹" + t.getAmount()
                    .toPlainString(),
                amtFont, rowColor);
        }

        document.add(table);

        // ── Footer ──────────────────────────────────
        Paragraph footer = new Paragraph(
            "\nGenerated by Finance Tracker · " +
            LocalDate.now().format(dateFmt),
            new Font(Font.FontFamily.HELVETICA, 8,
                Font.ITALIC, BaseColor.GRAY));
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
        log.info("PDF exported: {} transactions",
            transactions.size());
        return out.toByteArray();
    }

    private void addSummaryCell(
            PdfPTable table, String label,
            String value, BaseColor bg,
            BaseColor textColor) {
        Font labelFont = new Font(
            Font.FontFamily.HELVETICA, 9,
            Font.NORMAL, textColor);
        Font valueFont = new Font(
            Font.FontFamily.HELVETICA, 13,
            Font.BOLD, textColor);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(bg);
        cell.setPadding(10);
        cell.setBorder(Rectangle.NO_BORDER);

        Paragraph p = new Paragraph();
        p.add(new Chunk(label + "\n", labelFont));
        p.add(new Chunk(value, valueFont));
        cell.addElement(p);
        table.addCell(cell);
    }

    private void addTableCell(
            PdfPTable table, String text,
            Font font, BaseColor bg) {
        PdfPCell cell = new PdfPCell(
            new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setPadding(5);
        cell.setBorderColor(
            new BaseColor(229, 231, 235));
        table.addCell(cell);
    }
}