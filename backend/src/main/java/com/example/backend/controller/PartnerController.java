package com.example.backend.controller;

import com.example.backend.model.Franchise;
import com.example.backend.repository.FranchiseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/partner")
@CrossOrigin(origins = "*") // For development
public class PartnerController {

    @Autowired
    private FranchiseRepository franchiseRepository;
    
    @Autowired
    private JavaMailSender mailSender;

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        
        Optional<Franchise> existingOpt = franchiseRepository.findByEmail(email);
        Franchise franchise;
        if (existingOpt.isPresent()) {
            franchise = existingOpt.get();
            if (franchise.getStatus().equals("APPROVED")) {
                return ResponseEntity.badRequest().body("Email already registered with an active account");
            }
        } else {
            franchise = new Franchise();
            franchise.setEmail(email);
        }
        
        String otp = String.format("%06d", new Random().nextInt(999999));
        franchise.setOtp(otp);
        franchise.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        franchiseRepository.save(franchise);
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("DineSync Partner Verification");
            message.setText("Welcome to DineSync Partner Network! Your OTP is: " + otp + "\n\nValid for 10 minutes.");
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to send OTP email");
        }
        
        return ResponseEntity.ok("OTP sent to email");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        
        Optional<Franchise> franchiseOpt = franchiseRepository.findByEmail(email);
        if (franchiseOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("No pending registration found for this email");
        }
        
        Franchise franchise = franchiseOpt.get();
        if (franchise.getOtp() == null || !franchise.getOtp().equals(otp)) {
            return ResponseEntity.badRequest().body("Invalid OTP");
        }
        if (franchise.getOtpExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("OTP has expired");
        }
        
        // OTP verified successfully
        franchise.setOtp(null);
        franchise.setOtpExpiry(null);
        franchiseRepository.save(franchise);
        
        return ResponseEntity.ok("Email verified");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Franchise partnerInfo) {
        Optional<Franchise> franchiseOpt = franchiseRepository.findByEmail(partnerInfo.getEmail());
        if (franchiseOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Please verify your email first");
        }
        
        Franchise saved = franchiseOpt.get();
        
        // Update all details
        saved.setOwnerName(partnerInfo.getOwnerName());
        saved.setContactNumber(partnerInfo.getContactNumber());
        saved.setName(partnerInfo.getName()); // Restaurant name
        saved.setLocation(partnerInfo.getLocation());
        
        // Documents
        saved.setFssaiLicense(partnerInfo.getFssaiLicense());
        saved.setFssaiLicenseFile(partnerInfo.getFssaiLicenseFile());
        saved.setGstNumber(partnerInfo.getGstNumber());
        saved.setGstNumberFile(partnerInfo.getGstNumberFile());
        saved.setBankDetails(partnerInfo.getBankDetails());
        saved.setBankDetailsFile(partnerInfo.getBankDetailsFile());
        saved.setOwnerIdProof(partnerInfo.getOwnerIdProof());
        saved.setOwnerIdProofFile(partnerInfo.getOwnerIdProofFile());
        
        saved.setStatus("PENDING"); // Pending admin approval
        
        franchiseRepository.save(saved);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Application submitted successfully! Please wait for Admin approval.");
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        // The query would normally be findByUsername
        // We will add findByUsername to FranchiseRepository in the next step
        Optional<Franchise> franchiseOpt = franchiseRepository.findByUsername(username);
        
        if (franchiseOpt.isPresent() && franchiseOpt.get().getPassword().equals(password)) {
            if (!"APPROVED".equals(franchiseOpt.get().getStatus())) {
                return ResponseEntity.status(403).body("Account is not approved yet.");
            }
            return ResponseEntity.ok(franchiseOpt.get());
        }
        return ResponseEntity.status(401).body("Invalid Username or Password");
    }

    @GetMapping("/list")
    public ResponseEntity<?> getAllPartners() {
        return ResponseEntity.ok(franchiseRepository.findAll());
    }

    // --- ADMIN ENDPOINTS ---

    @PostMapping("/admin/approve/{id}")
    public ResponseEntity<?> approvePartner(@PathVariable Long id) {
        Optional<Franchise> franchiseOpt = franchiseRepository.findById(id);
        if (franchiseOpt.isPresent()) {
            Franchise franchise = franchiseOpt.get();
            franchise.setStatus("APPROVED");
            
            // Generate username and password
            String username = franchise.getName().replaceAll("\\s+", "").toLowerCase() + id;
            String password = java.util.UUID.randomUUID().toString().substring(0, 8);
            
            franchise.setUsername(username);
            franchise.setPassword(password);
            franchise.setPlatformCommissionRate(new java.math.BigDecimal("15.00"));
            
            franchiseRepository.save(franchise);
            
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(franchise.getEmail());
                message.setSubject("DineSync Partner Application Approved!");
                message.setText("Congratulations! Your application to join DineSync has been approved.\n\n" +
                        "We are thrilled to welcome you to the DineSync Partner Network! " +
                        "Please note that the standard platform commission rate applied to your orders is 15%.\n\n" +
                        "Here are your login credentials for the Partner Dashboard:\n" +
                        "Username: " + username + "\n" +
                        "Password: " + password + "\n\n" +
                        "Welcome aboard!");
                mailSender.send(message);
            } catch (Exception e) {
                e.printStackTrace();
            }
            
            return ResponseEntity.ok(franchise);
        }
        return ResponseEntity.badRequest().body("Partner not found");
    }

    @PostMapping("/admin/reject/{id}")
    public ResponseEntity<?> rejectPartner(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<Franchise> franchiseOpt = franchiseRepository.findById(id);
        if (franchiseOpt.isPresent()) {
            Franchise franchise = franchiseOpt.get();
            franchise.setStatus("REJECTED");
            franchiseRepository.save(franchise);
            
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(franchise.getEmail());
                message.setSubject("DineSync Partner Application Update");
                message.setText("Thank you for your interest in joining DineSync.\n\n" +
                        "Unfortunately, we are unable to approve your application at this time. " +
                        (body.containsKey("reason") ? "Reason: " + body.get("reason") : "Please ensure all documents meet our criteria.") + 
                        "\n\nYou may re-apply with corrected details.");
                mailSender.send(message);
            } catch (Exception e) {
                e.printStackTrace();
            }
            
            return ResponseEntity.ok("Partner rejected");
        }
        return ResponseEntity.badRequest().body("Partner not found");
    }

    @PostMapping("/admin/suspend/{id}")
    public ResponseEntity<?> suspendPartner(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<Franchise> franchiseOpt = franchiseRepository.findById(id);
        if (franchiseOpt.isPresent()) {
            Franchise franchise = franchiseOpt.get();
            franchise.setStatus("SUSPENDED");
            franchiseRepository.save(franchise);
            
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(franchise.getEmail());
                message.setSubject("DineSync Partner Account Suspended");
                message.setText("Your DineSync Partner account has been suspended by the administration.\n\n" +
                        (body.containsKey("reason") && body.get("reason") != null && !body.get("reason").isEmpty() ? "Reason: " + body.get("reason") : "Violations of Terms of Service.") + 
                        "\n\nPlease contact support for more details.");
                mailSender.send(message);
            } catch (Exception e) {
                e.printStackTrace();
            }
            
            return ResponseEntity.ok("Partner suspended");
        }
        return ResponseEntity.badRequest().body("Partner not found");
    }

    @PostMapping("/admin/unban/{id}")
    public ResponseEntity<?> unbanPartner(@PathVariable Long id) {
        Optional<Franchise> franchiseOpt = franchiseRepository.findById(id);
        if (franchiseOpt.isPresent()) {
            Franchise franchise = franchiseOpt.get();
            franchise.setStatus("APPROVED");
            franchiseRepository.save(franchise);
            
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(franchise.getEmail());
                message.setSubject("DineSync Partner Account Restored");
                message.setText("Good news! Your DineSync Partner account has been reviewed and successfully restored by the administration.\n\n" +
                        "You can now log back into your partner dashboard and resume your operations.\n\n" +
                        "Welcome back to DineSync!");
                mailSender.send(message);
            } catch (Exception e) {
                e.printStackTrace();
            }
            
            return ResponseEntity.ok("Partner restored");
        }
        return ResponseEntity.badRequest().body("Partner not found");
    }
}
