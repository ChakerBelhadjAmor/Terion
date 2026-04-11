package com.teriak.model;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionPlan {

    private List<Product> products;
    private PlanParams params;
    private List<AtelierCapacity> utilization;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Product {
        private int id;
        private String name;
        private String dci;
        private String form;
        private int lots;
        private List<String> gamme;
        private Map<String, Double> processingTimes;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanParams {
        private int weeks;
        private int daysPerWeek;
        private int shiftsPerDay;
        private int hoursPerShift;
        private double efficiency;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AtelierCapacity {
        private String atelier;
        private String name;
        private double load;
        private double capacity;
        private double utilization;
    }
}
