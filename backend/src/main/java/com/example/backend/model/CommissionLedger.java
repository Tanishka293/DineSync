package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "commission_ledger")
public class CommissionLedger {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long franchiseId;
    private Long orderId;

    private BigDecimal orderTotal;
    
    // The revenue DineSync keeps
    private BigDecimal platformFee; 
    
    // The amount paid to the Franchise (Order Total - Platform Fee)
    private BigDecimal franchisePayout; 

    private LocalDateTime processedAt = LocalDateTime.now();
}
