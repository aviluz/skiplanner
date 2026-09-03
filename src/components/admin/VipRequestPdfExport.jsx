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