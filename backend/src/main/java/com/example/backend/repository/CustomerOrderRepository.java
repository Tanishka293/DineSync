package com.example.backend.repository;

import com.example.backend.model.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findByFranchiseId(Long franchiseId);
    List<CustomerOrder> findByCustomerEmail(String customerEmail);
}
