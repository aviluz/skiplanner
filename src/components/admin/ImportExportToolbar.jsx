const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, FileSpreadsheet, Loader2, CheckCircle2, FileDown } from "lucide-react";
import { toast } from "sonner";

import {
  exportToExcel,
  downloadTemplate,
  downloadErrorReport,
  parseExcelFile,
  processImport,
} from "@/lib/excelImportExport";

const STATUS_LABELS = {
  new: "חדש",
  fill_empty: "השלמה",
  skip: "דילוג",
  invalid: "שגיאה",
};

const STATUS_BADGES = {
  new: "bg-green-100 text-green-700 border-green-300",
  fill_empty: "bg-amber-100 text-amber-700 border-amber-300",
  skip: "bg-slate-100 text-slate-600 border-slate-300",
  invalid: "bg-red-100 text-red-700 border-red-300",
};

function displayValue(value) {
  if (value == null) return "ריק";
  if (typeof value === "string" && value.trim() === "") return "ריק";
  if (Array.isArray(value) && value.length === 0) return "ריק";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function ImportExportToolbar({
  config,
  data,
  extraData,
  onDataRefresh,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importStep, setImportStep] = useState("upload"); // upload | scanning | preview | importing | success
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      exportToExcel(data, config, extraData);
      toast.success(`ייוצאו ${data.length} רשומות ל-Excel`);
    } catch (e) {
      console.error("Export error", e);
      toast.error("שגיאה בייצוא ל-Excel");
    } finally {
      setExporting(false);
    }
  };

  const handleTemplate = () => {
    try {
      downloadTemplate(config);
      toast.success("תבנית הורדה בהצלחה");
    } catch (e) {
      console.error("Template error", e);
      toast.error("שגיאה בהורדת תבנית");
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportStep("scanning");
    setDialogOpen(true);

    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        toast.error("הקובץ ריק או לא תקין");
        setImportStep("upload");
        return;
      }
      const result = processImport(rows, data, config, extraData);
      setPreview(result);
      setImportStep("preview");
    } catch (err) {
      console.error("Import parse error", err);
      toast.error("שגיאה בקריאת הקובץ");
      setImportStep("upload");
    }
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    if (preview.newRecords.length === 0 && preview.fillEmptyRecords.length === 0) return;

    setImportStep("importing");

    let added = 0;
    let updated = 0;

    try {
      // CREATE: new records
      if (preview.newRecords.length > 0) {
        const recordsToCreate = preview.newRecords.map((r) => {
          const rec = { ...r.record };
          if (config.virtualExportFields) {
            config.virtualExportFields.forEach((vf) => delete rec[vf]);
          }
          Object.keys(rec).forEach((k) => rec[k] === undefined && delete rec[k]);
          return rec;
        });

        for (let i = 0; i < recordsToCreate.length; i += 100) {
          const batch = recordsToCreate.slice(i, i + 100);
          const created = await db.entities[config.entityName].bulkCreate(batch);
          added += Array.isArray(created) ? created.length : batch.length;
        }
      }

      // FILL_EMPTY: update existing records (only completable fields)
      if (preview.fillEmptyRecords.length > 0) {
        for (const r of preview.fillEmptyRecords) {
          const updateData = {};
          r.completableFields.forEach((f) => {
            updateData[f.field] = f.newValue;
          });
          try {
            await db.entities[config.entityName].update(r.existingId, updateData);
            updated++;
          } catch (err) {
            console.error(`Failed to update record ${r.existingId}:`, err);
          }
        }
      }

      // Log the import
      try {
        await db.entities.ImportLog.create({
          entity_name: config.entityName,
          file_name: fileName,
          total_rows: preview.totalRows,
          new_count: preview.newRecords.length,
          fill_empty_count: preview.fillEmptyRecords.length,
          skip_count: preview.skipRecords.length,
          invalid_count: preview.invalidRecords.length,
          added_count: added,
          updated_count: updated,
        });
      } catch (logErr) {
        console.error("Failed to log import", logErr);
      }

      setImportResult({
        added,
        updated,
        skipped: preview.skipRecords.length,
        failed: preview.invalidRecords.length,
      });
      setImportStep("success");

      if (onDataRefresh) {
        await onDataRefresh();
      }
    } catch (err) {
      console.error("Import error", err);
      toast.error(`שגיאה בייבוא: ${err.message || "לא ידוע"}`);
      setImportStep("preview");
    }
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setImportStep("upload");
    setPreview(null);
    setImportResult(null);
    setFileName("");
  };

  const totalActionable = preview
    ? preview.newRecords.length + preview.fillEmptyRecords.length
    : 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={exporting || data.length === 0}
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 ml-1 animate-spin" />
        ) : (
          <Download className="w-4 h-4 ml-1" />
        )}
        ייצוא ל-Excel
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 ml-1" />
        ייבוא מ-Excel
      </Button>

      <Button variant="outline" size="sm" onClick={handleTemplate}>
        <FileSpreadsheet className="w-4 h-4 ml-1" />
        הורד תבנית
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && resetDialog()}>
        <DialogContent dir="rtl" className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              ייבוא {config.displayName} מ-Excel
            </DialogTitle>
          </DialogHeader>

          {/* Scanning */}
          {importStep === "scanning" && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-slate-600">סורק את הקובץ...</p>
            </div>
          )}

          {/* Preview */}
          {importStep === "preview" && preview && (
            <div className="space-y-4">
              <div className="text-sm text-slate-500">
                קובץ: <strong>{fileName}</strong> — סה"כ {preview.totalRows} שורות
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {preview.newRecords.length}
                  </div>
                  <div className="text-xs text-green-600">רשומות חדשות</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-700">
                    {preview.fillEmptyRecords.length}
                  </div>
                  <div className="text-xs text-amber-600">השלמות מידע</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-slate-600">
                    {preview.skipRecords.length}
                  </div>
                  <div className="text-xs text-slate-500">קיימות (דילוג)</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-700">
                    {preview.invalidRecords.length}
                  </div>
                  <div className="text-xs text-red-600">שגיאות</div>
                </div>
              </div>

              {/* Completions table */}
              {preview.fillEmptyRecords.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-amber-800">פירוט השלמות מידע:</h4>
                  <div className="rounded-lg border overflow-hidden max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">יעד / רשומה</TableHead>
                          <TableHead className="text-right">שדה</TableHead>
                          <TableHead className="text-right">ערך קיים</TableHead>
                          <TableHead className="text-right">ערך חדש</TableHead>
                          <TableHead className="text-right">פעולה</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.fillEmptyRecords.map((r) =>
                          r.completableFields.map((f, i) => (
                            <TableRow key={`${r.rowNum}-${f.field}`}>
                              {i === 0 && (
                                <TableCell
                                  rowSpan={r.completableFields.length}
                                  className="font-medium align-top"
                                >
                                  {r.displayName}
                                </TableCell>
                              )}
                              <TableCell className="text-sm">{f.field}</TableCell>
                              <TableCell className="text-sm text-slate-400">
                                {displayValue(f.oldValue)}
                              </TableCell>
                              <TableCell className="text-sm text-green-700 font-medium">
                                {displayValue(f.newValue)}
                              </TableCell>
                              <TableCell>
                                <Badge className={STATUS_BADGES.fill_empty}>השלמה</Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Detail table for all records */}
              <div className="rounded-lg border overflow-hidden max-h-48 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-16">שורה</TableHead>
                      <TableHead className="text-right">שם / זיהוי</TableHead>
                      <TableHead className="text-right w-20">סטטוס</TableHead>
                      <TableHead className="text-right">סיבה</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ...preview.newRecords,
                      ...preview.fillEmptyRecords,
                      ...preview.skipRecords,
                      ...preview.invalidRecords,
                    ].slice(0, 100).map((r) => (
                      <TableRow key={`${r.rowNum}-${r.status}`}>
                        <TableCell className="text-xs text-slate-400">{r.rowNum}</TableCell>
                        <TableCell className="text-sm font-medium">{r.displayName}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGES[r.status]}>
                            {STATUS_LABELS[r.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{r.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {preview.invalidRecords.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadErrorReport(preview.invalidRecords, config)}
                >
                  <FileDown className="w-4 h-4 ml-1" />
                  הורד דוח שגיאות
                </Button>
              )}
            </div>
          )}

          {/* Importing */}
          {importStep === "importing" && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p className="text-slate-600">מייבא נתונים ומשלים שדות...</p>
            </div>
          )}

          {/* Success */}
          {importStep === "success" && importResult && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle2 className="w-8 h-8" />
                <span className="text-lg font-semibold">הייבוא הסתיים בהצלחה</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-700">{importResult.added}</div>
                  <div className="text-xs text-green-600">נוספו</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-700">{importResult.updated}</div>
                  <div className="text-xs text-amber-600">עודכנו (השלמה)</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-slate-600">{importResult.skipped}</div>
                  <div className="text-xs text-slate-500">דולגו</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-700">{importResult.failed}</div>
                  <div className="text-xs text-red-600">נכשלו</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {importStep === "preview" && (
              <>
                <Button variant="outline" onClick={resetDialog}>
                  ביטול
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  disabled={totalActionable === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  ייבא נתונים והשלם שדות חסרים ({totalActionable})
                </Button>
              </>
            )}
            {importStep === "success" && (
              <Button onClick={resetDialog}>סגור</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}