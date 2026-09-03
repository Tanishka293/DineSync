package com.example.backend.service;

import com.example.backend.model.CustomerOrder;
import com.example.backend.repository.CustomerOrderRepository;
import com.example.backend.repository.FoodItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerOrderService {

    private final CustomerOrderRepository customerOrderRepository;
    private final FoodItemRepository foodItemRepository;

    public CustomerOrder placeOrder(CustomerOrder orderRequest) {
        // 1. Force the status to PENDING before saving to ensure security
        orderRequest.setStatus(CustomerOrder.OrderStatus.PENDING_FRANCHISE_APPROVAL);
        // 2. Save the transaction to MySQL (Strict ACID Compliance)
        return customerOrderRepository.save(orderRequest);
    }

    public List<CustomerOrder> getPartnerOrders(Long franchiseId) {
        return customerOrderRepository.findByFranchiseId(franchiseId);
    }

    public CustomerOrder updateOrderStatus(Long orderId, String status) {
        CustomerOrder order = customerOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(CustomerOrder.OrderStatus.valueOf(status));
        return customerOrderRepository.save(order);
    }

    public CustomerOrder getOrder(Long orderId) {
        return customerOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public List<CustomerOrder> getUserOrders(String email) {
        return customerOrderRepository.findByCustomerEmail(email);
    }

    public CustomerOrder rateOrder(Long orderId, Integer newRating) {
        CustomerOrder order = customerOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
                
        if (newRating == null || newRating < 1 || newRating > 5) return order;
        
        Integer oldRating = order.getRating();
        order.setRating(newRating);
        
        if (order.getFoodItemIds() != null && !order.getFoodItemIds().isEmpty()) {
            for (String itemId : order.getFoodItemIds().split(",")) {
                foodItemRepository.findById(itemId).ifPresent(item -> {
                    if (item.getRatingCount() == null) item.setRatingCount(0);
                    if (item.getRatingSum() == null) item.setRatingSum(0.0);
                    
                    if (oldRating != null) {
                        item.setRatingSum(item.getRatingSum() - oldRating + newRating);
                    } else {
                        item.setRatingCount(item.getRatingCount() + 1);
                        item.setRatingSum(item.getRatingSum() + newRating);
                    }
                    item.setAverageRating(item.getRatingSum() / item.getRatingCount());
                    foodItemRepository.save(item);
                });
            }
        }
        
        return customerOrderRepository.save(order);
    }
    
    public List<CustomerOrder> getAllOrders() {
        return customerOrderRepository.findAll();
    }
}
