package com.preet.airesumeanalyzer.service;

import java.io.IOException;
import java.io.InputStream;
import lombok.RequiredArgsConstructor;
import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.sax.BodyContentHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.xml.sax.SAXException;

@Service
@RequiredArgsConstructor
public class TikaTextExtractionService implements TextExtractionService {

    private static final Logger log = LoggerFactory.getLogger(TikaTextExtractionService.class);

    private final AutoDetectParser parser = new AutoDetectParser();

    @Override
    public String extractText(InputStream inputStream) {
        BodyContentHandler handler = new BodyContentHandler(-1);
        Metadata metadata = new Metadata();
        ParseContext context = new ParseContext();
        try (inputStream) {
            parser.parse(inputStream, handler, metadata, context);
        } catch (IOException | SAXException | TikaException e) {
            throw new IllegalStateException("Failed to extract resume text", e);
        }
        String text = handler.toString().replaceAll("\n+", "\n").trim();
        log.debug("Extracted text of length {}", text.length());
        return text;
    }
}
