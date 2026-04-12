package com.teriak.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pdp_plan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PdpPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "upload_date", nullable = false)
    private Instant uploadDate;

    @Column(nullable = false)
    private String status;

    private String filename;

    @Column(name = "product_count")
    private Integer productCount;

    @OneToMany(
        mappedBy = "plan",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<PdpEntry> entries = new ArrayList<>();

    public void addEntry(PdpEntry entry) {
        entries.add(entry);
        entry.setPlan(this);
    }
}
