package com.teriak.controller;

import com.teriak.dto.PdpPlanDetail;
import com.teriak.dto.PdpPlanSummary;
import com.teriak.model.ProductionPlan;
import com.teriak.model.ProductionPlan.*;
import com.teriak.service.CapacityService;
import com.teriak.service.PdpPlanService;
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
@RequestMapping("/api")
@RequiredArgsConstructor
public class PdpController {

    private final PdpPlanService pdpPlanService;
    private final CapacityService capacityService;

    /**
     * Upload, parse, and PERSIST a PDP Excel file as a new scenario.
     * Form fields: file (required), name (optional — defaults to filename).
     */
    @PostMapping(value = "/pdp/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPdp(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Le fichier est vide."));
        }
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Format de fichier invalide. Utilisez .xlsx ou .xls"));
        }
        try {
            String scenarioName = (name == null || name.isBlank()) ? filename : name.trim();
            PdpPlanDetail saved = pdpPlanService.uploadAndSave(scenarioName, file);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Error saving PDP scenario", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Lightweight list of all saved PDP scenarios. */
    @GetMapping("/pdps")
    public ResponseEntity<List<PdpPlanSummary>> listPdps() {
        return ResponseEntity.ok(pdpPlanService.listPlans());
    }

    /** Full detail of a specific PDP scenario. */
    @GetMapping("/pdp/{id}")
    public ResponseEntity<?> getPdp(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(pdpPlanService.getPlan(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /** Delete a saved scenario. */
    @DeleteMapping("/pdp/{id}")
    public ResponseEntity<?> deletePdp(@PathVariable Long id) {
        try {
            pdpPlanService.deletePlan(id);
            return ResponseEntity.ok(Map.of("deleted", id));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /** Compute capacity utilization for given products and params (stateless). */
    @PostMapping("/pdp/capacity")
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

    @GetMapping("/pdp/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "Teriak Plan de Charge"));
    }
}
