package com.teriak.dto;

import com.teriak.model.ProductionPlan.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PdpPlanDetail {
    private Long id;
    private String name;
    private Instant uploadDate;
    private String status;
    private String filename;
    private Integer productCount;
    private List<Product> products;
}
