package com.teriak.service;

import com.teriak.model.ProductionPlan.Product;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Slf4j
@Service
public class ExcelParserService {

    private static final List<String> ATELIERS = List.of("A","B","C","D","E","F","G","H","I","J");
    private static final String[] COLORS = {"#3CC2B1","#5dd0c1","#1B6862","#FBB829","#e0a020","#2fa898","#134e4a"};

    public List<Product> parseFile(MultipartFile file) throws IOException {
        List<Product> products = new ArrayList<>();

        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) throw new IllegalArgumentException("Fichier Excel vide ou mal formaté.");

            Map<String, Integer> colIndex = buildHeaderIndex(headerRow);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String name = getCellString(row, colIndex.getOrDefault("PRODUIT",
                        colIndex.getOrDefault("PRODUCT", 0)));
                if (name == null || name.isBlank()) continue;

                int lots = (int) getCellNumeric(row, colIndex.getOrDefault("LOTS",
                        colIndex.getOrDefault("LOT", -1)));
                if (lots <= 0) lots = 1;

                List<String> gamme = new ArrayList<>();
                Map<String, Double> processingTimes = new HashMap<>();

                for (String atelier : ATELIERS) {
                    Integer idx = colIndex.get(atelier);
                    if (idx == null) continue;
                    double time = getCellNumeric(row, idx);
                    if (time > 0) {
                        gamme.add(atelier);
                        processingTimes.put(atelier, time);
                    }
                }

                if (gamme.isEmpty()) {
                    gamme = List.of("A", "G", "H", "I", "J");
                    for (String a : gamme) processingTimes.put(a, 4.0);
                }

                products.add(Product.builder()
                        .id(i)
                        .name(name)
                        .dci(getCellString(row, colIndex.getOrDefault("DCI", -1)))
                        .form(getCellString(row, colIndex.getOrDefault("FORME",
                                colIndex.getOrDefault("FORM", -1))))
                        .lots(lots)
                        .gamme(gamme)
                        .processingTimes(processingTimes)
                        .color(COLORS[(i - 1) % COLORS.length])
                        .build());
            }
        }

        if (products.isEmpty()) {
            throw new IllegalArgumentException("Aucun produit trouvé dans le fichier.");
        }

        log.info("Parsed {} products from Excel file: {}", products.size(), file.getOriginalFilename());
        return products;
    }

    private Map<String, Integer> buildHeaderIndex(Row headerRow) {
        Map<String, Integer> index = new HashMap<>();
        for (Cell cell : headerRow) {
            String header = getCellAsString(cell).trim().toUpperCase();
            if (!header.isEmpty()) index.put(header, cell.getColumnIndex());
        }
        return index;
    }

    private String getCellString(Row row, int colIdx) {
        if (colIdx < 0 || row == null) return null;
        Cell cell = row.getCell(colIdx);
        return cell == null ? null : getCellAsString(cell).trim();
    }

    private double getCellNumeric(Row row, int colIdx) {
        if (colIdx < 0 || row == null) return 0;
        Cell cell = row.getCell(colIdx);
        if (cell == null) return 0;
        try {
            if (cell.getCellType() == CellType.NUMERIC) return cell.getNumericCellValue();
            return Double.parseDouble(getCellAsString(cell).trim());
        } catch (NumberFormatException e) { return 0; }
    }

    private String getCellAsString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            default -> "";
        };
    }
}
