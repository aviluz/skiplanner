import * as XLSX from "xlsx";

// ── Normalization helpers ──

export function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value == null || value === "") return undefined;
  const str = String(value).trim().toLowerCase();
  if (["true", "כן", "yes", "1", "✓"].includes(str)) return true;
  if (["false", "לא", "no", "0"].includes(str)) return false;
  return undefined;
}

export function normalizeNumber(value) {
  if (typeof value === "number") return value;
  if (value == null || value === "") return undefined;
  const num = Number(String(value).replace(/[,\s]/g, ""));
  return isNaN(num) ? undefined : num;
}

export function normalizeDate(value) {
  if (!value && value !== 0) return undefined;
  if (value instanceof Date) return value.toISOString().split("T")[0];
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const m = str.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (m) {
    const day = m[1].padStart(2, "0");
    const month = m[2].padStart(2, "0");
    return `${m[3]}-${month}-${day}`;
  }
  const serial = Number(str);
  if (!isNaN(serial) && serial > 30000 && serial < 80000) {
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  return undefined;
}

export function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return undefined;
  const str = String(value).trim();
  if (!str) return [];
  return str.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean);
}

export function normalizeJson(value) {
  if (typeof value === "object" && value !== null) return value;
  if (!value) return undefined;
  const str = String(value).trim();
  if (!str) return undefined;
  try {
    return JSON.parse(str);
  } catch {
    return undefined;
  }
}

// ── Export ──

function serializeForExcel(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return value;
}

function buildExportFields(config) {
  const fields = [...config.contentFields];
  if (config.virtualExportFields) {
    config.virtualExportFields.forEach((vf) => {
      if (!fields.includes(vf)) fields.push(vf);
    });
  }
  return [...fields, ...config.systemFields];
}

export function exportToExcel(data, config, extraData) {
  const exportFields = buildExportFields(config);

  const rows = data.map((record) => {
    const row = {};
    exportFields.forEach((field) => {
      row[field] = serializeForExcel(record[field]);
    });
    if (config.exportTransform) {
      const extra = config.exportTransform(record, extraData);
      Object.keys(extra).forEach((key) => {
        row[key] = serializeForExcel(extra[key]);
      });
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows, { header: exportFields });
  ws["!cols"] = exportFields.map((field) => {
    const maxLen = Math.max(
      field.length,
      ...rows.map((r) => String(r[field] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, config.entityName.substring(0, 31));

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(buffer, `${config.entityName}_export_${new Date().toISOString().split("T")[0]}.xlsx`);
}

export function downloadTemplate(config) {
  const fields = buildExportFields(config).filter(
    (f) => !config.systemFields.includes(f)
  );
  const ws = XLSX.utils.aoa_to_sheet([fields]);
  ws["!cols"] = fields.map((f) => ({ wch: Math.max(f.length + 2, 15) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, config.entityName.substring(0, 31));

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(buffer, `${config.entityName}_template.xlsx`);
}

export function downloadErrorReport(invalidRecords, config) {
  const rows = invalidRecords.map((r) => ({
    row_number: r.rowNum,
    ...Object.fromEntries(
      Object.entries(r.record).map(([k, v]) => [k, serializeForExcel(v)])
    ),
    error: r.reason,
  }));
  if (rows.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Errors");
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(buffer, `${config.entityName}_import_errors.xlsx`);
}

// ── Import ──

export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

export function processImport(rows, existingData, config, extraData) {
  const existingByKey = new Map();
  existingData.forEach((r) => {
    existingByKey.set(config.naturalKey(r), r);
  });
  const seenKeys = new Set();

  const newRecords = [];
  const fillEmptyRecords = [];
  const skipRecords = [];
  const invalidRecords = [];

  const zeroIsMissing = new Set(config.zeroIsMissingFields || []);
  const jsonFields = new Set(
    Object.entries(config.fieldTypes || {})
      .filter(([, type]) => type === "json")
      .map(([field]) => field)
  );

  const isDbFieldEmpty = (dbRecord, field) => {
    const value = dbRecord[field];
    if (value == null) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === "number" && value === 0 && zeroIsMissing.has(field)) return true;
    return false;
  };

  const isExcelValueValid = (value) => {
    if (value == null) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  };

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const errors = [];
    let record = {};

    // Normalize content fields
    config.contentFields.forEach((field) => {
      const fieldType = config.fieldTypes?.[field] || "string";
      const raw = row[field];

      if (raw === "" || raw == null) {
        record[field] = undefined;
        return;
      }

      switch (fieldType) {
        case "number":
          record[field] = normalizeNumber(raw);
          if (record[field] === undefined) errors.push(`${field}: ערך מספרי לא תקין`);
          break;
        case "boolean":
          record[field] = normalizeBoolean(raw);
          if (record[field] === undefined) errors.push(`${field}: ערך בוליאני לא תקין`);
          break;
        case "date":
          record[field] = normalizeDate(raw);
          if (record[field] === undefined) errors.push(`${field}: תאריך לא תקין`);
          break;
        case "array":
          record[field] = normalizeArray(raw);
          break;
        case "json":
          record[field] = normalizeJson(raw);
          if (record[field] === undefined) errors.push(`${field}: JSON לא תקין`);
          break;
        default:
          record[field] = String(raw).trim();
      }
    });

    // Virtual fields (e.g. category_name)
    if (config.virtualExportFields) {
      config.virtualExportFields.forEach((vf) => {
        if (row[vf] != null && row[vf] !== "") {
          record[vf] = String(row[vf]).trim();
        }
      });
    }

    // Import transform (e.g. resolve category_name → category_id)
    if (config.importTransform) {
      record = config.importTransform(record, extraData);
    }

    // Required fields
    config.requiredFields.forEach((field) => {
      if (record[field] == null || record[field] === "") {
        errors.push(`חסר שדה חובה: ${field}`);
      }
    });

    // Enum validation
    if (config.enumValues) {
      Object.entries(config.enumValues).forEach(([field, values]) => {
        if (record[field] && !values.includes(record[field])) {
          errors.push(`${field}: ערך לא תקין (אפשרי: ${values.join(", ")})`);
        }
      });
    }

    // Custom validation
    if (config.importValidate) {
      const customError = config.importValidate(record, extraData);
      if (customError) errors.push(customError);
    }

    if (errors.length > 0) {
      invalidRecords.push({
        rowNum,
        record,
        status: "invalid",
        reason: errors.join("; "),
        displayName: record.name || record.code || `שורה ${rowNum}`,
      });
      return;
    }

    const key = config.naturalKey(record);
    const existingRecord = existingByKey.get(key);

    if (existingRecord) {
      // Compare field-by-field: only fill fields that are empty in DB
      const completableFields = [];
      config.contentFields.forEach((field) => {
        if (!isExcelValueValid(record[field])) return; // Excel empty → skip
        if (isDbFieldEmpty(existingRecord, field)) {
          completableFields.push({
            field,
            oldValue: existingRecord[field],
            newValue: record[field],
          });
        }
      });

      if (completableFields.length > 0) {
        fillEmptyRecords.push({
          rowNum,
          record,
          status: "fill_empty",
          reason: `${completableFields.length} שדות להשלמה`,
          displayName: record.name || record.code || `שורה ${rowNum}`,
          existingId: existingRecord.id,
          completableFields,
        });
      } else {
        skipRecords.push({
          rowNum,
          record,
          status: "skip",
          reason: "כל השדות מלאים",
          displayName: record.name || record.code || `שורה ${rowNum}`,
        });
      }
    } else if (seenKeys.has(key)) {
      invalidRecords.push({
        rowNum,
        record,
        status: "invalid",
        reason: "כפילות בתוך קובץ הייבוא",
        displayName: record.name || record.code || `שורה ${rowNum}`,
      });
    } else {
      seenKeys.add(key);
      newRecords.push({
        rowNum,
        record,
        status: "new",
        reason: "יתווסף לדאטה",
        displayName: record.name || record.code || `שורה ${rowNum}`,
      });
    }
  });

  return {
    newRecords,
    fillEmptyRecords,
    skipRecords,
    invalidRecords,
    totalRows: rows.length,
  };
}

// ── Utils ──

function downloadBlob(buffer, filename) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}