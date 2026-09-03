package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "customer_orders")
public class CustomerOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long franchiseId; 
    private String customerEmail;
    private String customerName;
    private String customerContact;
    private String deliveryAddress;
    
    // Storing Mongo IDs as a comma-separated string for simplicity
    private String foodItemIds; 

    private BigDecimal totalAmount;
    
    private Integer rating; // 1 to 5, null if not rated

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private String payoutStatus = "PENDING";

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum OrderStatus {
        PENDING_FRANCHISE_APPROVAL,
        ACCEPTED_PREPARING,
        PACKED,
        ON_THE_WAY,
        DELIVERED,
        REJECTED,
        CANCELLED_REFUNDED
    }
}
