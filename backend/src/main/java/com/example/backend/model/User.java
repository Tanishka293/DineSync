package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email; // Acts as the Google ID / Email

    @Column(nullable = false)
    private String password;
    
    private String name;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isVerified = false;

    private String otp;
    
    private java.time.LocalDateTime otpExpiry;
}
