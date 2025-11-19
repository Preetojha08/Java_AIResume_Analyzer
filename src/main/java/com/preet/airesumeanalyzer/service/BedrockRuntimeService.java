package com.preet.airesumeanalyzer.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.preet.airesumeanalyzer.config.AwsProperties;
import com.preet.airesumeanalyzer.domain.dto.ResumeAnalysisResult;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

@Service
@RequiredArgsConstructor
public class BedrockRuntimeService implements BedrockService {

    private static final Logger log = LoggerFactory.getLogger(BedrockRuntimeService.class);
    private static final String PROMPT_TEMPLATE = """
You are an ATS-style resume evaluator.

RESUME:
%s

TASKS:
- Give an ATS score (0-100) as integer.
- Extract technical skills as an array of strings.
- Extract soft skills as an array of strings.
- List strengths as an array of strings.
- List weaknesses as an array of strings.
- Recommend 3 suitable job roles as an array of strings.
- List missing important keywords for a typical software developer role as an array of strings.
- Provide a 3-4 line professional summary as a string.

Return ONLY valid JSON with keys: atsScore, skillsTechnical, skillsSoft, strengths, weaknesses, suggestedRoles, missingKeywords, summary.
""";

    private final BedrockRuntimeClient bedrockRuntimeClient;
    private final AwsProperties awsProperties;
    private final ObjectMapper objectMapper;

    @Override
    public ResumeAnalysisResult analyzeResumeText(String resumeText) {
        String prompt = PROMPT_TEMPLATE.formatted(resumeText);
        String payload = buildRequestPayload(prompt);

        InvokeModelRequest request = InvokeModelRequest.builder()
                .modelId(awsProperties.getBedrock().getModelId())
                .contentType("application/json")
                .accept("application/json")
                .body(SdkBytes.fromString(payload, StandardCharsets.UTF_8))
                .build();

        InvokeModelResponse response = bedrockRuntimeClient.invokeModel(request);
        String responseBody = response.body().asUtf8String();
        log.debug("Bedrock raw response: {}", responseBody);
        String parsedJson = extractModelJson(responseBody);
        try {
            return objectMapper.readValue(parsedJson, ResumeAnalysisResult.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Unable to parse Bedrock response", e);
        }
    }

    private String buildRequestPayload(String prompt) {
        try {
            return objectMapper.writeValueAsString(objectMapper.createObjectNode()
                    .put("prompt", prompt)
                    .put("max_tokens_to_sample", 1024)
                    .put("temperature", 0)
                    .put("top_p", 0.9));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize Bedrock payload", e);
        }
    }

    private String extractModelJson(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            if (root.has("output")) {
                return root.get("output").asText();
            }
            if (root.has("result")) {
                return root.get("result").asText();
            }
            return responseBody;
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot parse Bedrock envelope", e);
        }
    }
}
