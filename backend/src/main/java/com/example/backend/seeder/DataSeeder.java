package com.example.backend.seeder;

import com.example.backend.model.FoodItem;
import com.example.backend.model.Franchise;
import com.example.backend.repository.FoodItemRepository;
import com.example.backend.repository.FranchiseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final FranchiseRepository franchiseRepository;
    private final FoodItemRepository foodItemRepository;

    @Override
    public void run(String... args) throws Exception {
        // If MySQL has no franchises, let's create our test data!
        if (franchiseRepository.count() == 0) {
            System.out.println("No franchises found. Starting database seeding...");

            // 1. Create Franchises (Stored in MySQL)
            Franchise f1 = new Franchise();
            f1.setName("Burger Hub - South Ex");
            f1.setEmail("south@burgerhub.com");
            f1.setPassword("password123");
            f1.setStatus("APPROVED");
            f1.setPlatformCommissionRate(new BigDecimal("15.00")); // DineSync takes 15%

            Franchise f2 = new Franchise();
            f2.setName("Spicy Ramen - CP");
            f2.setEmail("cp@spicyramen.com");
            f2.setPassword("password123");
            f2.setStatus("APPROVED");
            f2.setPlatformCommissionRate(new BigDecimal("12.50")); // DineSync takes 12.5%

            franchiseRepository.saveAll(Arrays.asList(f1, f2));
            System.out.println("Franchises seeded in MySQL successfully!");

            // 2. Create Food Items (Stored in MongoDB)
            foodItemRepository.deleteAll(); // Clear old mongo data

            FoodItem item1 = new FoodItem();
            item1.setFranchiseId(f1.getId()); // Linking MongoDB back to MySQL Franchise ID
            item1.setName("Classic Cheeseburger");
            item1.setDescription("Juicy beef patty with melted cheddar and secret sauce.");
            item1.setPrice(new BigDecimal("350.00"));
            item1.setImageUrl("https://images.unsplash.com/photo-1568901346375-23c9450c58cd");

            FoodItem item2 = new FoodItem();
            item2.setFranchiseId(f1.getId());
            item2.setName("Truffle Fries");
            item2.setDescription("Crispy fries tossed in truffle oil and parmesan.");
            item2.setPrice(new BigDecimal("200.00"));
            item2.setImageUrl("https://images.unsplash.com/photo-1576107232684-1279f390859f");

            FoodItem item3 = new FoodItem();
            item3.setFranchiseId(f2.getId());
            item3.setName("Spicy Miso Ramen");
            item3.setDescription("Rich pork broth with spicy miso, chashu, and soft egg.");
            item3.setPrice(new BigDecimal("450.00"));
            item3.setImageUrl("https://images.unsplash.com/photo-1569718212165-3a8278d5f624");

            foodItemRepository.saveAll(Arrays.asList(item1, item2, item3));
            System.out.println("Food items seeded in MongoDB successfully!");
            System.out.println("==================================================");
            System.out.println("DINESYNC BACKEND IS READY AND SEEDED!");
            System.out.println("==================================================");
        }
    }
}
