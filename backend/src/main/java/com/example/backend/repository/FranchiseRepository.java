package com.example.backend.repository;

import com.example.backend.model.Franchise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FranchiseRepository extends JpaRepository<Franchise, Long> {
    java.util.Optional<Franchise> findByEmail(String email);
    java.util.Optional<Franchise> findByUsername(String username);
}
