package com.example.backend.controller;

import com.example.backend.model.FoodItem;
import com.example.backend.repository.FoodItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
@CrossOrigin(origins = "*") // Allows our React frontend to fetch data
@RequiredArgsConstructor
public class FoodItemController {
    
    private final FoodItemRepository foodItemRepository;

    // The React Homepage will call this to display all the food!
    @GetMapping("/items")
    public List<FoodItem> getAllFoodItems() {
        return foodItemRepository.findAll();
    }

    @PostMapping("/items")
    public FoodItem addFoodItem(@RequestBody FoodItem foodItem) {
        return foodItemRepository.save(foodItem);
    }

    @PutMapping("/items/{id}")
    public FoodItem updateFoodItem(@PathVariable String id, @RequestBody FoodItem updatedItem) {
        updatedItem.setId(id);
        return foodItemRepository.save(updatedItem);
    }

    @DeleteMapping("/items/{id}")
    public void deleteFoodItem(@PathVariable String id) {
        foodItemRepository.deleteById(id);
    }

    @DeleteMapping("/items")
    public void deleteAllFoodItems() {
        foodItemRepository.deleteAll();
    }
}
