package com.example.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;

@Data
@Document(collection = "food_items")
public class FoodItem {
    @Id
    private String id;

    // This links the MongoDB item to the MySQL Franchise!
    private Long franchiseId; 
    
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    
    // New fields
    private String prepDuration;
    private boolean inStock = true;
    private String dietaryPreference = "Veg";
    private String franchiseName;
    private String franchiseLocation;
    
    private Integer ratingCount = 0;
    private Double ratingSum = 0.0;
    private Double averageRating = 0.0;
}
