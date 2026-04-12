package com.teriak.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pdp_entry")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PdpEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    @ToString.Exclude
    private PdpPlan plan;

    @Column(name = "product_name", nullable = false)
    private String productName;

    private String dci;

    private String form;

    @Column(nullable = false)
    private Integer lots;

    private Integer priority;

    @Column(name = "delivery_week")
    private Integer deliveryWeek;

    /** JSON array of atelier codes, e.g. ["A","B","G"] */
    @Column(name = "gamme_json", columnDefinition = "TEXT")
    private String gammeJson;

    /** JSON map of atelier -> hours, e.g. {"A":4.0,"B":3.0} */
    @Column(name = "processing_times_json", columnDefinition = "TEXT")
    private String processingTimesJson;

    private String color;
}
