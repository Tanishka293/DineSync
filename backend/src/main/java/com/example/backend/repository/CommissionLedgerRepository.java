package com.example.backend.repository;

import com.example.backend.model.CommissionLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommissionLedgerRepository extends JpaRepository<CommissionLedger, Long> {
    List<CommissionLedger> findByFranchiseId(Long franchiseId);
}
