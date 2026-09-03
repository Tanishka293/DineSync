package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "franchises")
public class Franchise {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // Restaurant Name
    private String username; // Auto-generated for login
    private String email;
    private String password; // Auto-generated
    private String ownerName;
    private String contactNumber;
    private String location;
    
    // Documents
    private String fssaiLicense;
    @Column(columnDefinition = "LONGTEXT")
    private String fssaiLicenseFile;

    private String gstNumber;
    @Column(columnDefinition = "LONGTEXT")
    private String gstNumberFile;

    private String bankDetails;
    @Column(columnDefinition = "LONGTEXT")
    private String bankDetailsFile;

    private String ownerIdProof;
    @Column(columnDefinition = "LONGTEXT")
    private String ownerIdProofFile;

    // Status: PENDING, APPROVED, REJECTED
    private String status = "PENDING";
    
    // OTP verification
    private String otp;
    private java.time.LocalDateTime otpExpiry;
    
    // The percentage DineSync takes from this franchise (e.g. 15.00)
    private BigDecimal platformCommissionRate; 
}
