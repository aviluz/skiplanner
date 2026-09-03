import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export default function VipRequestPdfExport({ vipRequest }) {
  const [generating, setGenerating] = React.useState(false);
  const contentRef = React.useRef(null);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the hidden content as image
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF, split into pages if needed
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const fileName = `VIP_Request_${vipRequest.user_name?.replace(/\s+/g, '_') || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('הקובץ הורד בהצלחה');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('שגיאה ביצירת קובץ PDF');
    } finally {
      setGenerating(false);
    }
  };

  const statusText = 
    vipRequest.status === 'new' ? 'חדש' :
    vipRequest.status === 'in_progress' ? 'בטיפול' :
    vipRequest.status === 'completed' ? 'הושלם' : 'בוטל';

  return (
    <>
      {/* Hidden content for PDF generation */}
      <div ref={contentRef} style={{ position: 'absolute', left: '-9999px', width: '794px', backgroundColor: '#ffffff' }}>
        <div style={{ fontFamily: 'Arial, sans-serif', direction: 'rtl', padding: '40px', textAlign: 'right' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white', padding: '30px', margin: '-40px -40px 30px -40px', textAlign: 'center', borderRadius: '0' }}>
            <h1 style={{ margin: '0', fontSize: '32px', fontWeight: 'bold' }}>טופס בקשת VIP - SkiPlanner</h1>
            <p style={{ margin: '10px 0 0 0', fontSize: '18px', opacity: 0.95 }}>פרטי הבקשה</p>
          </div>

          {/* User Info */}
          <div style={{ background: '#f1f5f9', border: '2px solid #cbd5e1', borderRadius: '8px', padding: '20px', marginBottom: '25px' }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#1e293b', borderBottom: '3px solid #3b82f6', paddingBottom: '10px' }}>פרטי המבקש</h2>
            <div style={{ fontSize: '15px', lineHeight: '1.8' }}>
              <p style={{ margin: '10px 0' }}><strong>שם:</strong> {vipRequest.user_name || 'לא צוין'}</p>
              <p style={{ margin: '10px 0', direction: 'ltr', textAlign: 'left' }}><strong>Email:</strong> {vipRequest.user_email || 'לא צוין'}</p>
              <p style={{ margin: '10px 0' }}><strong>סטטוס:</strong> <span style={{ background: '#dbeafe', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', color: '#1e40af' }}>{statusText}</span></p>
              <p style={{ margin: '10px 0' }}><strong>תאריך שליחה:</strong> {new Date(vipRequest.created_date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          {/* Sections */}
          {vipRequest.form_data?.sections?.map((section, idx) => (
            <div key={idx} style={{ marginBottom: '30px' }}>
              <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#1e293b', borderBottom: '3px solid #3b82f6', paddingBottom: '10px' }}>{section.title}</h2>
              
              {section.fields?.map((field, fieldIdx) => {
                const value = field.value != null && field.value !== '' ? String(field.value) : 'לא מולא';
                return (
                  <div key={fieldIdx} style={{ background: '#f8fafc', padding: '14px', marginBottom: '12px', borderRadius: '8px', borderRight: '4px solid #3b82f6' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#475569', marginBottom: '6px' }}>{field.label}</div>
                    <div style={{ fontSize: '15px', color: '#1e293b', whiteSpace: 'pre-wrap' }}>{value}</div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Admin Notes */}
          {vipRequest.admin_notes && (
            <div style={{ marginTop: '35px', background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '8px', padding: '20px' }}>
              <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#92400e', borderBottom: '2px solid #f59e0b', paddingBottom: '10px' }}>הערות מנהל</h2>
              <div style={{ fontSize: '15px', color: '#78350f', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{vipRequest.admin_notes}</div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '2px solid #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            <p style={{ margin: '8px 0', fontWeight: 'bold' }}>SkiPlanner.co.il - מערכת תכנון חופשות סקי</p>
            <p style={{ margin: '8px 0' }}>נוצר בתאריך: {new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={generatePDF}
        disabled={generating}
        className="flex items-center gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            יוצר PDF...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            הורד PDF
          </>
        )}
      </Button>
    </>
  );
}