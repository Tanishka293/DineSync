package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "payout_transactions")
public class PayoutTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long franchiseId;
    private BigDecimal amount;
    private LocalDateTime createdAt = LocalDateTime.now();
}
