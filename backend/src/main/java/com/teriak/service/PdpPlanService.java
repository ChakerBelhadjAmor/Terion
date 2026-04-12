package com.teriak.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teriak.dto.PdpPlanDetail;
import com.teriak.dto.PdpPlanSummary;
import com.teriak.entity.PdpEntry;
import com.teriak.entity.PdpPlan;
import com.teriak.model.ProductionPlan.Product;
import com.teriak.repository.PdpPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdpPlanService {

    private final PdpPlanRepository repository;
    private final ExcelParserService excelParser;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Parse Excel file and persist as a new PdpPlan. */
    @Transactional
    public PdpPlanDetail uploadAndSave(String scenarioName, MultipartFile file) throws IOException {
        List<Product> products = excelParser.parseFile(file);

        PdpPlan plan = PdpPlan.builder()
            .name(scenarioName)
            .uploadDate(Instant.now())
            .status("DRAFT")
            .filename(file.getOriginalFilename())
            .productCount(products.size())
            .build();

        for (Product p : products) {
            PdpEntry entry = PdpEntry.builder()
                .productName(p.getName())
                .dci(p.getDci())
                .form(p.getForm())
                .lots(p.getLots())
                .priority(null)
                .deliveryWeek(null)
                .gammeJson(writeJson(p.getGamme()))
                .processingTimesJson(writeJson(p.getProcessingTimes()))
                .color(p.getColor())
                .build();
            plan.addEntry(entry);
        }

        PdpPlan saved = repository.save(plan);
        log.info("Saved PdpPlan id={} name='{}' with {} entries", saved.getId(), saved.getName(), products.size());
        return toDetail(saved);
    }

    @Transactional(readOnly = true)
    public List<PdpPlanSummary> listPlans() {
        return repository.findAllByOrderByUploadDateDesc().stream()
            .map(this::toSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public PdpPlanDetail getPlan(Long id) {
        PdpPlan plan = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("PDP not found: " + id));
        // Force load entries while in TX
        plan.getEntries().size();
        return toDetail(plan);
    }

    @Transactional
    public void deletePlan(Long id) {
        repository.deleteById(id);
    }

    // ----- mapping helpers -----

    private PdpPlanSummary toSummary(PdpPlan p) {
        return PdpPlanSummary.builder()
            .id(p.getId())
            .name(p.getName())
            .uploadDate(p.getUploadDate())
            .status(p.getStatus())
            .filename(p.getFilename())
            .productCount(p.getProductCount())
            .build();
    }

    private PdpPlanDetail toDetail(PdpPlan p) {
        List<Product> products = new ArrayList<>();
        int i = 1;
        for (PdpEntry e : p.getEntries()) {
            products.add(Product.builder()
                .id(i++)
                .name(e.getProductName())
                .dci(e.getDci())
                .form(e.getForm())
                .lots(e.getLots() != null ? e.getLots() : 1)
                .gamme(readJsonList(e.getGammeJson()))
                .processingTimes(readJsonMap(e.getProcessingTimesJson()))
                .color(e.getColor())
                .build());
        }
        return PdpPlanDetail.builder()
            .id(p.getId())
            .name(p.getName())
            .uploadDate(p.getUploadDate())
            .status(p.getStatus())
            .filename(p.getFilename())
            .productCount(p.getProductCount())
            .products(products)
            .build();
    }

    private String writeJson(Object o) {
        try { return objectMapper.writeValueAsString(o); }
        catch (Exception e) { return "null"; }
    }

    private List<String> readJsonList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return objectMapper.readValue(json, new TypeReference<List<String>>() {}); }
        catch (Exception e) { return List.of(); }
    }

    private Map<String, Double> readJsonMap(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try { return objectMapper.readValue(json, new TypeReference<Map<String, Double>>() {}); }
        catch (Exception e) { return Map.of(); }
    }
}
