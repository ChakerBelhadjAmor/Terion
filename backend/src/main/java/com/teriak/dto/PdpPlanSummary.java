package com.teriak.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PdpPlanSummary {
    private Long id;
    private String name;
    private Instant uploadDate;
    private String status;
    private String filename;
    private Integer productCount;
}
