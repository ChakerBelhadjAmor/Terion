package com.teriak.service;

import com.teriak.model.ProductionPlan;
import com.teriak.model.ProductionPlan.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CapacityService {

    private static final List<String> ATELIERS = List.of("A","B","C","D","E","F","G","H","I","J");
    private static final Map<String, String> ATELIER_NAMES = Map.of(
        "A", "Pesée & Granulation",
        "B", "Compression",
        "C", "Enrobage",
        "D", "Remplissage Aseptique",
        "E", "Stérilisation",
        "F", "Lyophilisation",
        "G", "Conditionnement Primaire",
        "H", "Conditionnement Secondaire",
        "I", "Contrôle Qualité",
        "J", "Libération & Stockage"
    );

    public double computeCapacity(PlanParams params) {
        return params.getWeeks()
                * params.getDaysPerWeek()
                * params.getShiftsPerDay()
                * params.getHoursPerShift()
                * (params.getEfficiency() / 100.0);
    }

    public List<AtelierCapacity> computeUtilization(List<Product> products, PlanParams params) {
        double capacity = computeCapacity(params);
        Map<String, Double> loads = new LinkedHashMap<>();
        ATELIERS.forEach(a -> loads.put(a, 0.0));

        for (Product product : products) {
            for (String atelier : product.getGamme()) {
                Double time = product.getProcessingTimes().get(atelier);
                if (time != null) {
                    loads.merge(atelier, product.getLots() * time, Double::sum);
                }
            }
        }

        List<AtelierCapacity> result = new ArrayList<>();
        for (String atelier : ATELIERS) {
            double load = loads.getOrDefault(atelier, 0.0);
            double util = capacity > 0 ? Math.round((load / capacity) * 1000.0) / 10.0 : 0;
            result.add(AtelierCapacity.builder()
                    .atelier(atelier)
                    .name(ATELIER_NAMES.getOrDefault(atelier, "Atelier " + atelier))
                    .load(Math.round(load * 10.0) / 10.0)
                    .capacity(Math.round(capacity * 10.0) / 10.0)
                    .utilization(util)
                    .build());
        }
        return result;
    }
}
