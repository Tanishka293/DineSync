package com.example.backend.repository;

import com.example.backend.model.PayoutTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PayoutTransactionRepository extends JpaRepository<PayoutTransaction, Long> {
    List<PayoutTransaction> findByFranchiseId(Long franchiseId);
}
