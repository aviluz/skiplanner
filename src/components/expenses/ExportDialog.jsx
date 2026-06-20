import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

const CURRENCY_SYMBOLS = {
  ILS: "₪",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export default function ExportDialog({ 
  isOpen, 
  onClose, 
  expenses, 
  settlements, 
  participants, 
  groupName,
  baseCurrency 
}) {
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState(participants);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;

      if (fromDate && expDate < fromDate) return false;
      if (toDate && expDate > toDate) return false;

      if (selectedParticipants.length > 0) {
        if (!selectedParticipants.includes(exp.payer_name)) return false;
      }

      return true;
    });
  }, [expenses, dateFrom, dateTo, selectedParticipants]);

  const filteredSettlements = useMemo(() => {
    return settlements.filter(set => {
      const setDate = new Date(set.date);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;

      if (fromDate && setDate < fromDate) return false;
      if (toDate && setDate > toDate) return false;

      if (selectedParticipants.length > 0) {
        if (!selectedParticipants.includes(set.from_person) && !selectedParticipants.includes(set.to_person)) {
          return false;
        }
      }

      return true;
    });
  }, [settlements, dateFrom, dateTo, selectedParticipants]);

  const toggleParticipant = (participant) => {
    setSelectedParticipants(prev => 
      prev.includes(participant) 
        ? prev.filter(p => p !== participant)
        : [...prev, participant]
    );
  };

  const exportToCSV = () => {
    if (filteredExpenses.length === 0 && filteredSettlements.length === 0) {
      toast.error('אין נתונים לייצוא בסינון הנוכחי');
      return;
    }

    let csvContent = '\uFEFF'; // BOM for Hebrew support
    
    // Expenses section
    csvContent += `נתוני קבוצה: ${groupName}\n`;
    csvContent += `תאריך ייצוא: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n\n`;
    
    csvContent += 'הוצאות\n';
    csvContent += 'תאריך,תיאור,סכום,מטבע,שער המרה,סכום במטבע בסיס,משלם,קטגוריה,מוטבים\n';
    
    filteredExpenses.forEach(exp => {
      const beneficiaries = exp.beneficiaries?.join('; ') || '';
      csvContent += `${format(new Date(exp.date), 'dd/MM/yyyy')},`;
      csvContent += `"${exp.title}",`;
      csvContent += `${exp.amount},`;
      csvContent += `${exp.currency},`;
      csvContent += `${exp.exchange_rate || 1},`;
      csvContent += `${exp.amount_in_base || (exp.amount * (exp.exchange_rate || 1))},`;
      csvContent += `${exp.payer_name},`;
      csvContent += `${exp.category},`;
      csvContent += `"${beneficiaries}"\n`;
    });

    const totalExpenses = filteredExpenses.reduce((sum, exp) => 
      sum + (exp.amount_in_base || (exp.amount * (exp.exchange_rate || 1))), 0
    );
    csvContent += `\nסה"כ הוצאות,,,,,${totalExpenses.toFixed(2)},${baseCurrency}\n\n`;

    // Settlements section
    if (filteredSettlements.length > 0) {
      csvContent += '\nהתחשבנויות\n';
      csvContent += 'תאריך,מעביר,מקבל,סכום\n';
      
      filteredSettlements.forEach(set => {
        csvContent += `${format(new Date(set.date), 'dd/MM/yyyy')},`;
        csvContent += `${set.from_person},`;
        csvContent += `${set.to_person},`;
        csvContent += `${set.amount}\n`;
      });

      const totalSettlements = filteredSettlements.reduce((sum, set) => sum + set.amount, 0);
      csvContent += `\nסה"כ התחשבנויות,,,${totalSettlements.toFixed(2)}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${groupName}_expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('הקובץ הורד בהצלחה');
    onClose();
  };

  const exportToPDF = () => {
    if (filteredExpenses.length === 0 && filteredSettlements.length === 0) {
      toast.error('אין נתונים לייצוא בסינון הנוכחי');
      return;
    }

    const doc = new jsPDF();
    
    // Add Hebrew font support (using default for now, will render as boxes but structure will be correct)
    doc.setFont('helvetica');
    
    let yPos = 20;
    
    // Title
    doc.setFontSize(18);
    doc.text(`Group: ${groupName}`, 105, yPos, { align: 'center' });
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text(`Export Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, yPos, { align: 'center' });
    yPos += 15;

    // Expenses
    doc.setFontSize(14);
    doc.text('Expenses', 20, yPos);
    yPos += 10;

    doc.setFontSize(9);
    filteredExpenses.forEach((exp, idx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      const expText = `${format(new Date(exp.date), 'dd/MM/yyyy')} - ${exp.title}`;
      const amountText = `${CURRENCY_SYMBOLS[exp.currency] || exp.currency}${exp.amount.toFixed(2)}`;
      const payerText = `Paid by: ${exp.payer_name}`;
      
      doc.text(expText, 20, yPos);
      doc.text(amountText, 190, yPos, { align: 'right' });
      yPos += 5;
      doc.text(payerText, 20, yPos);
      yPos += 8;
    });

    const totalExpenses = filteredExpenses.reduce((sum, exp) => 
      sum + (exp.amount_in_base || (exp.amount * (exp.exchange_rate || 1))), 0
    );
    
    yPos += 5;
    doc.setFontSize(11);
    doc.text(`Total Expenses: ${CURRENCY_SYMBOLS[baseCurrency]}${totalExpenses.toFixed(2)}`, 20, yPos);
    yPos += 15;

    // Settlements
    if (filteredSettlements.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Settlements', 20, yPos);
      yPos += 10;

      doc.setFontSize(9);
      filteredSettlements.forEach((set, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const setText = `${format(new Date(set.date), 'dd/MM/yyyy')} - ${set.from_person} -> ${set.to_person}`;
        const amountText = `${CURRENCY_SYMBOLS[baseCurrency]}${set.amount.toFixed(2)}`;
        
        doc.text(setText, 20, yPos);
        doc.text(amountText, 190, yPos, { align: 'right' });
        yPos += 8;
      });

      const totalSettlements = filteredSettlements.reduce((sum, set) => sum + set.amount, 0);
      yPos += 5;
      doc.setFontSize(11);
      doc.text(`Total Settlements: ${CURRENCY_SYMBOLS[baseCurrency]}${totalSettlements.toFixed(2)}`, 20, yPos);
    }

    doc.save(`${groupName}_expenses_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('הקובץ הורד בהצלחה');
    onClose();
  };

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">ייצוא נתונים</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">פורמט ייצוא</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setExportFormat('csv')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  exportFormat === 'csv' 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <FileSpreadsheet className={`w-8 h-8 mx-auto mb-2 ${exportFormat === 'csv' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="font-medium">CSV</div>
                <div className="text-xs text-slate-500">Excel / Sheets</div>
              </button>
              <button
                onClick={() => setExportFormat('pdf')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  exportFormat === 'pdf' 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <FileText className={`w-8 h-8 mx-auto mb-2 ${exportFormat === 'pdf' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div className="font-medium">PDF</div>
                <div className="text-xs text-slate-500">מסמך</div>
              </button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <Label className="text-base font-semibold mb-3 block">סינון לפי תאריך (אופציונלי)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-slate-600">מתאריך</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm text-slate-600">עד תאריך</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Participants Filter */}
          <div>
            <Label className="text-base font-semibold mb-3 block">סינון לפי משתתפים (אופציונלי)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {participants.map(participant => (
                <div key={participant} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={`export-${participant}`}
                    checked={selectedParticipants.includes(participant)}
                    onCheckedChange={() => toggleParticipant(participant)}
                  />
                  <Label htmlFor={`export-${participant}`} className="cursor-pointer text-sm">
                    {participant}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Stats */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="text-sm text-slate-600 space-y-1">
              <p>הוצאות שייוצאו: <span className="font-bold text-slate-800">{filteredExpenses.length}</span></p>
              <p>התחשבנויות שייוצאו: <span className="font-bold text-slate-800">{filteredSettlements.length}</span></p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={handleExport} disabled={filteredExpenses.length === 0 && filteredSettlements.length === 0}>
            <Download className="w-4 h-4 ml-2" />
            ייצא {exportFormat.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}