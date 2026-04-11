package com.teriak.controller;

import com.teriak.model.ProductionPlan;
import com.teriak.model.ProductionPlan.*;
import com.teriak.service.CapacityService;
import com.teriak.service.ExcelParserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/pdp")
@RequiredArgsConstructor
public class PdpController {

    private final ExcelParserService excelParser;
    private final CapacityService capacityService;

    /**
     * Upload and parse a PDP Excel file.
     * Returns the list of parsed products.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPdp(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le fichier est vide."));
        }
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Format de fichier invalide. Utilisez .xlsx ou .xls"));
        }
        try {
            List<Product> products = excelParser.parseFile(file);
            return ResponseEntity.ok(Map.of(
                "products", products,
                "count", products.size(),
                "filename", filename
            ));
        } catch (Exception e) {
            log.error("Error parsing Excel file: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Compute capacity utilization for given products and params.
     */
    @PostMapping("/capacity")
    public ResponseEntity<?> computeCapacity(@RequestBody ProductionPlan plan) {
        try {
            List<AtelierCapacity> utilization = capacityService.computeUtilization(
                plan.getProducts(), plan.getParams()
            );
            double capacity = capacityService.computeCapacity(plan.getParams());
            return ResponseEntity.ok(Map.of(
                "utilization", utilization,
                "capacity", capacity
            ));
        } catch (Exception e) {
            log.error("Error computing capacity: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Health check endpoint.
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "Teriak Plan de Charge"));
    }
}
