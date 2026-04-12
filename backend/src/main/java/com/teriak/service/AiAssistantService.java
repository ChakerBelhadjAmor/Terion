package com.teriak.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;

@Slf4j
@Service
public class AiAssistantService {

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:llama3}")
    private String modelName;

    private final RestTemplate restTemplate;

    public AiAssistantService(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(120))
                .build();
    }

    public String chat(String userMessage, Map<String, Object> context) {
        String fullPrompt = buildSystemPrompt(context) + "\n\nQuestion: " + userMessage;

        try {
            Map<String, Object> requestBody = Map.of(
                "model", modelName,
                "prompt", fullPrompt,
                "stream", false,
                "options", Map.of("temperature", 0.3, "num_predict", 512)
            );

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(
                ollamaBaseUrl + "/api/generate",
                requestBody,
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object reply = response.getBody().get("response");
                if (reply instanceof String s) return s;
            }
        } catch (Exception e) {
            log.warn("Ollama unavailable, using fallback: {}", e.getMessage());
        }

        return generateFallback(userMessage, context);
    }

    private String buildSystemPrompt(Map<String, Object> context) {
        StringBuilder sb = new StringBuilder();
        sb.append("Tu es l'assistant IA du logiciel Terion — Plan de Charge de Laboratoires Teriak. ");
        sb.append("Tu analyses la capacité de production des ateliers pharmaceutiques (A à J) ");
        sb.append("et fournis des recommandations d'optimisation.\n\n");
        sb.append("Contexte actuel:\n");

        if (context != null) {
            Object overloaded   = context.get("overloaded");
            Object nearCapacity = context.get("nearCapacity");
            Object worstAtelier = context.get("worstAtelier");
            Object params       = context.get("params");

            if (overloaded instanceof java.util.List<?> ol && !ol.isEmpty()) {
                sb.append("- Ateliers en SURCHARGE: ").append(ol).append("\n");
            }
            if (nearCapacity instanceof java.util.List<?> nc && !nc.isEmpty()) {
                sb.append("- Ateliers proches de la capacité: ").append(nc).append("\n");
            }
            if (worstAtelier != null) {
                sb.append("- Atelier le plus chargé: ").append(worstAtelier).append("\n");
            }
            if (params instanceof Map<?,?> p) {
                sb.append("- Paramètres: ").append(p).append("\n");
            }
        }

        sb.append("\nRéponds en français, de façon concise et professionnelle. ");
        sb.append("Utilise des données chiffrées et propose des actions concrètes.");
        return sb.toString();
    }

    private String generateFallback(String message, Map<String, Object> context) {
        String lower = message.toLowerCase();

        if (lower.contains("suggestion") || lower.contains("optimis") || lower.contains("oui")) {
            return "Voici mes recommandations prioritaires :\n\n" +
                   "1. Ajouter un 3ème poste sur les ateliers surchargés\n" +
                   "2. Reporter les lots non-critiques aux semaines suivantes\n" +
                   "3. Augmenter le rendement via une maintenance préventive ciblée\n\n" +
                   "Souhaitez-vous simuler l'un de ces scénarios dans l'onglet Simulation ?";
        }
        if (lower.contains("capacit")) {
            return "La capacité est calculée selon la formule : Semaines × Jours/Sem × Postes/Jour × Heures/Poste × Rendement. " +
                   "Vous pouvez ajuster tous ces paramètres dans l'onglet Simulation.";
        }
        return "Je suis à votre disposition pour analyser votre plan de charge et vous proposer des optimisations. " +
               "Que souhaitez-vous savoir sur la capacité de vos ateliers ?";
    }
}
