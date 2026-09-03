package com.example.backend.controller;

import com.example.backend.model.SupportTicket;
import com.example.backend.repository.SupportTicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = "*")
public class SupportTicketController {

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @PostMapping("/tickets")
    public SupportTicket createTicket(@RequestBody SupportTicket ticket) {
        ticket.setCreatedAt(LocalDateTime.now());
        ticket.setStatus("PENDING");
        return supportTicketRepository.save(ticket);
    }

    @GetMapping("/tickets/user/{email}")
    public List<SupportTicket> getUserTickets(@PathVariable String email) {
        return supportTicketRepository.findByUserEmailOrderByCreatedAtDesc(email);
    }

    @GetMapping("/tickets")
    public List<SupportTicket> getAllTickets() {
        return supportTicketRepository.findAll();
    }

    @PostMapping("/tickets/{id}/reply")
    public SupportTicket replyTicket(@PathVariable String id, @RequestBody java.util.Map<String, String> body) {
        java.util.Optional<SupportTicket> ticketOpt = supportTicketRepository.findById(id);
        if (ticketOpt.isPresent()) {
            SupportTicket ticket = ticketOpt.get();
            ticket.setAdminReply(body.get("reply"));
            ticket.setStatus("REPLIED");
            return supportTicketRepository.save(ticket);
        }
        return null;
    }
}
