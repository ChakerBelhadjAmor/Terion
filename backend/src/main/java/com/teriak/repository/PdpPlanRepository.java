package com.teriak.repository;

import com.teriak.entity.PdpPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PdpPlanRepository extends JpaRepository<PdpPlan, Long> {
    List<PdpPlan> findAllByOrderByUploadDateDesc();
}
