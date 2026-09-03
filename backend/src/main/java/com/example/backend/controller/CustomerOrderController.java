package com.example.backend.controller;

import com.example.backend.model.CustomerOrder;
import com.example.backend.service.CustomerOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*") // Allows React to checkout
@RequiredArgsConstructor
public class CustomerOrderController {

    private final CustomerOrderService customerOrderService;

    @PostMapping("/checkout")
    public CustomerOrder placeOrder(@RequestBody CustomerOrder orderRequest) {
        return customerOrderService.placeOrder(orderRequest);
    }

    @GetMapping("/partner/{franchiseId}")
    public List<CustomerOrder> getPartnerOrders(@PathVariable Long franchiseId) {
        return customerOrderService.getPartnerOrders(franchiseId);
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long orderId, @RequestBody Map<String, String> body) {
        try {
            CustomerOrder savedOrder = customerOrderService.updateOrderStatus(orderId, body.get("status"));
            return ResponseEntity.ok(savedOrder);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(e.getMessage() + " | " + e.toString());
        }
    }

    @GetMapping("/{orderId}")
    public CustomerOrder getOrder(@PathVariable Long orderId) {
        return customerOrderService.getOrder(orderId);
    }

    @GetMapping("/user/{email}")
    public List<CustomerOrder> getUserOrders(@PathVariable String email) {
        return customerOrderService.getUserOrders(email);
    }

    @PutMapping("/{orderId}/rate")
    public CustomerOrder rateOrder(@PathVariable Long orderId, @RequestBody Map<String, Integer> body) {
        return customerOrderService.rateOrder(orderId, body.get("rating"));
    }
    
    @GetMapping("/all")
    public List<CustomerOrder> getAllOrders() {
        return customerOrderService.getAllOrders();
    }
}
