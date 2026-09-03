package com.example.backend.controller;

import com.example.backend.model.CustomerOrder;
import com.example.backend.repository.CustomerOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.example.backend.model.PayoutTransaction;
import com.example.backend.repository.PayoutTransactionRepository;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/payouts")
@CrossOrigin(origins = "http://localhost:5173")
public class PayoutController {

    @Autowired
    private CustomerOrderRepository customerOrderRepository;

    @Autowired
    private PayoutTransactionRepository payoutTransactionRepository;

    @PostMapping("/settle/{franchiseId}")
    public ResponseEntity<?> settlePayouts(@PathVariable Long franchiseId, @RequestBody Map<String, Object> body) {
        List<CustomerOrder> orders = customerOrderRepository.findByFranchiseId(franchiseId);
        int settledCount = 0;
        BigDecimal totalSettled = BigDecimal.ZERO;
        
        for (CustomerOrder order : orders) {
            if (CustomerOrder.OrderStatus.DELIVERED.equals(order.getStatus()) && "PENDING".equals(order.getPayoutStatus())) {
                order.setPayoutStatus("SETTLED");
                customerOrderRepository.save(order);
                settledCount++;
                totalSettled = totalSettled.add(order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);
            }
        }
        
        if (body.containsKey("amount")) {
            try {
                totalSettled = new BigDecimal(body.get("amount").toString());
            } catch (Exception e) {}
        }
        
        if (settledCount > 0) {
            PayoutTransaction txn = new PayoutTransaction();
            txn.setFranchiseId(franchiseId);
            txn.setAmount(totalSettled);
            payoutTransactionRepository.save(txn);
        }
        
        return ResponseEntity.ok(Map.of("message", "Payout settled successfully", "ordersSettled", settledCount));
    }

    @GetMapping("/partner/{franchiseId}")
    public ResponseEntity<List<PayoutTransaction>> getPartnerPayouts(@PathVariable Long franchiseId) {
        return ResponseEntity.ok(payoutTransactionRepository.findByFranchiseId(franchiseId));
    }
}
