# Tally Narration & Daily Activity Report Enhancement Requirements

## Overview
Enhanced Tally narration system with sub-category support, dynamic field requirements, and professional Excel report formatting.

---

## 1. Narration Generation with Sub-Categories

### 1.1 Field Structure
- **Main Category**: Narration type (e.g., "COD Charges against Order id", "COD Charges against PO", "I&C Charges")
- **Sub-Categories**: User-selectable sub-fields based on requirement
- **Dynamic Fields**: Additional fields that can be added/removed per user requirement

### 1.2 Implementation
```javascript
const NarrationConfig = {
  "COD Charges against Order id": {
    required: ["Vendor Name", "Order ID", "Paye Name"],
    optional: ["Reference", "Description", "Amount", "Invoice Number"],
    format: "Vendor : {Vendor Name} - {Narration without chain main}"
  },
  "COD Charges against PO": {
    required: ["Vendor Name", "PO Number", "Paye Name"],
    optional: ["Reference", "Description", "Amount", "Invoice Number"],
    format: "Vendor : {Vendor Name} - {Narration without chain main}"
  },
  "I&C Charges": {
    required: ["Vendor Name", "Order ID", "Paye Name"],
    optional: ["Reference", "Description", "Charge Amount", "Category"],
    format: "Vendor : {Vendor Name} - {Narration without chain main}"
  },
  "Other Charges": {
    required: ["Paye Name"],
    optional: ["Description", "Amount", "Reference"],
    format: "{Paye Name} - {Narration}"
  }
};
```

---

## 2. New Entry Screen - Tally Narration Field

### 2.1 Default Fields Assignment

When user selects:
- **"COD Charges against Order id"** → Auto-assign:
  - Vendor Name (required)
  - Order ID (required)
  - Paye Name (required)
  
- **"COD Charges against PO"** → Auto-assign:
  - Vendor Name (required)
  - PO Number (required)
  - Paye Name (required)
  
- **"I&C Charges"** → Auto-assign:
  - Vendor Name (required)
  - Order ID (required)
  - Paye Name (required)

### 2.2 User Customization
- Add additional optional fields as per requirement
- Mark fields as "Required" based on business logic
- Reorder fields for better UX

### 2.3 Form Structure
```html
<!-- Narration Type Selection -->
<select id="narrationCategory" required>
  <option value="">Select Narration Type</option>
  <option value="COD_ORDER">COD Charges against Order id</option>
  <option value="COD_PO">COD Charges against PO</option>
  <option value="IC_CHARGES">I&C Charges</option>
  <option value="OTHER">Other Charges</option>
</select>

<!-- Auto-populated Required Fields -->
<div id="requiredFieldsContainer">
  <!-- Dynamically populated based on selection -->
</div>

<!-- Optional Fields for User Addition -->
<div id="optionalFieldsContainer">
  <button id="addFieldBtn">+ Add Custom Field</button>
</div>

<!-- Narration Preview -->
<div id="narrationPreview">
  <label>Narration Preview:</label>
  <textarea id="narrationText" readonly></textarea>
</div>
```

---

## 3. Daily Activity Report Generation

### 3.1 Report Format Specification

#### For "COD Charges", "COD PO", & "I&C Charges":
```
Format: Vendor : {Tally Narration without chain main}

Example:
- Vendor : ABC Logistics - COD Charges
- Vendor : XYZ Import - I&C Charges
```

#### For Other Charges:
```
Format: {Paye Name} - {Full Narration}

Example:
- Finance Team - Processing Fee
- Customs - Import Duty
```

### 3.2 Report Structure
```
Daily Activity Report
Date: [Date]
Generated: [Timestamp]

┌─────────────────────────────────────────────────────────────────┐
│ S.No │ Date    │ Vendor/Paye │ Narration         │ Amount │ Ref │
├─────────────────────────────────────────────────────────────────┤
│  1   │ [Date]  │ Vendor: ABC  │ Narration Text    │ ₹5000  │ ORD1│
│  2   │ [Date]  │ Paye: XYZ    │ Narration Text    │ ₹2000  │ PO1 │
└─────────────────────────────────────────────────────────────────┘

Total: ₹7000
Count: 2 entries
```

### 3.3 Report Data Structure
```javascript
const DailyActivityReport = {
  date: "2026-09-29",
  entries: [
    {
      serialNo: 1,
      entryDate: "2026-09-29",
      category: "COD Charges against Order id",
      vendor: "ABC Logistics",
      payeeName: "Finance Department",
      narration: "ABC Logistics - COD Charges",
      displayFormat: "Vendor : ABC Logistics - COD Charges",
      amount: 5000,
      reference: "ORD-001",
      orderId: "ORD-001"
    },
    {
      serialNo: 2,
      entryDate: "2026-09-29",
      category: "COD Charges against PO",
      vendor: "XYZ Import",
      payeeName: "Accounts Team",
      narration: "XYZ Import - COD Charges",
      displayFormat: "Vendor : XYZ Import - COD Charges",
      amount: 2000,
      reference: "PO-001",
      poNumber: "PO-001"
    }
  ],
  summary: {
    totalEntries: 2,
    totalAmount: 7000,
    byCategory: {
      "COD Charges against Order id": { count: 1, amount: 5000 },
      "COD Charges against PO": { count: 1, amount: 2000 }
    }
  }
};
```

---

## 4. Excel Export - Professional Formatting

### 4.1 Excel Sheet Structure

**Sheet 1: Daily Activity Report**

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        DAILY ACTIVITY REPORT                               │
│                        Date: 2026-09-29                                    │
│                     Generated: 2026-09-29 10:30 AM                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  S.No │  Date    │  Vendor/Paye Name  │  Narration              │Amount  │
│  ─────┼──────────┼────────────────────┼────────────────────────┼────────│
│   1   │ 29-09-26 │ ABC Logistics      │ ABC Logistics-COD      │ 5,000  │
│   2   │ 29-09-26 │ XYZ Import         │ XYZ Import-COD Charges │ 2,000  │
│   3   │ 29-09-26 │ Finance Dept       │ Processing Fee         │ 1,500  │
│                                                                            │
│                                        TOTAL:                   │ 8,500  │
│                                        COUNT:                   │   3    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Formatting Specifications

| Element | Format |
|---------|--------|
| **Header** | Bold, 14pt, Center-aligned, Blue background (#4472C4), White text |
| **Date/Generated** | 11pt, Italic, Center-aligned, Gray text |
| **Column Headers** | Bold, 11pt, White text, Blue background (#4472C4), Center-aligned |
| **Data Rows** | 10pt, Alternating row colors (White & Light Gray #F0F0F0) |
| **Amount Column** | Right-aligned, Currency format (₹ #,##0.00) |
| **Summary Rows** | Bold, 11pt, Light Blue background (#B4C7E7) |
| **Borders** | 1pt, Dark Gray (#404040) |
| **Padding** | 5px internal padding in each cell |

### 4.3 Column Widths
- S.No: 50px
- Date: 90px
- Vendor/Paye Name: 200px
- Narration: 280px
- Amount: 100px

### 4.4 Summary Section (at bottom)
```
Total Records:          X
Total Amount:           ₹X,XXX.XX
By Category:
  - COD Charges Order:  X entries, ₹X,XXX.XX
  - COD Charges PO:     X entries, ₹X,XXX.XX
  - I&C Charges:        X entries, ₹X,XXX.XX
  - Other Charges:      X entries, ₹X,XXX.XX
```

### 4.5 Excel Generation Code Structure
```javascript
generateExcelReport(reportData) {
  const workbook = createWorkbook();
  const sheet = workbook.addSheet('Daily Activity Report');
  
  // Header Styling
  applyHeaderFormatting(sheet);
  
  // Column Definitions
  defineColumnWidths(sheet);
  
  // Add Report Data
  addReportData(sheet, reportData);
  
  // Add Summary Section
  addSummarySection(sheet, reportData);
  
  // Apply Conditional Formatting
  applyConditionalFormatting(sheet);
  
  // Auto-fit columns
  autoFitColumns(sheet);
  
  return workbook;
}
```

---

## 5. Implementation Priority

1. **Phase 1**: Narration configuration with sub-category support
2. **Phase 2**: New Entry form with dynamic field assignment
3. **Phase 3**: Daily Activity Report generation logic
4. **Phase 4**: Excel export with professional formatting
5. **Phase 5**: Testing & optimization

---

## 6. Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Excel Generation**: `ExcelJS` or `SheetJS`
- **Data Storage**: LocalStorage / IndexedDB
- **Formatting**: Custom CSS classes + Excel styling APIs

---

## 7. Validation Rules

- Paye Name: Always required before report generation
- Vendor Name: Required for COD & I&C charges
- Order/PO ID: Must match pattern (alphanumeric)
- Amount: Positive numbers only
- Date: Cannot be future date

---

## Notes
- Maintain data consistency across entries
- Provide undo/redo functionality
- Include data validation alerts
- Support multiple date range reports
- Enable filtering by category/vendor in final reports

