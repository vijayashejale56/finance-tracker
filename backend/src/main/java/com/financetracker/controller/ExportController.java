package com.financetracker.controller;

import com.financetracker.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Tag(name = "Export",
     description = "Export transactions to CSV or PDF")
@RestController
@RequestMapping("/api/v1/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @Operation(summary = "Export transactions to CSV",
               description = "Download all transactions as CSV file")
    @GetMapping("/csv")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to) throws Exception {

        byte[] csvBytes = exportService.exportToCsv(from, to);

        String filename = "transactions-" +
            LocalDate.now().format(
                DateTimeFormatter.ofPattern("yyyy-MM-dd")) +
            ".csv";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType(
                "text/csv; charset=UTF-8"))
            .contentLength(csvBytes.length)
            .body(csvBytes);
    }

    @Operation(summary = "Export transactions to PDF",
               description = "Download transaction report as PDF")
    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to) throws Exception {

        byte[] pdfBytes = exportService.exportToPdf(from, to);

        String filename = "finance-report-" +
            LocalDate.now().format(
                DateTimeFormatter.ofPattern("yyyy-MM-dd")) +
            ".pdf";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(pdfBytes.length)
            .body(pdfBytes);
    }
}