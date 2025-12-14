
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Sale, Payment } from '../types/database';

// Helper to generate doc
const generateLedgerDoc = (sale: Sale, payments: Payment[]) => {
  const doc = new jsPDF();
  const customerName = (sale as any).customer?.name || 'Customer';
  const unitNo = sale.unit_number || 'N/A';

  // --- Company Header ---
  doc.setFontSize(22);
  doc.setTextColor(22, 115, 255); // Company Blue
  doc.setFont('helvetica', 'bold');
  doc.text('Wishluv Buildcon Pvt Ltd', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment Ledger / Statement of Account', 105, 28, { align: 'center' });

  // Divider Line
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(15, 35, 195, 35);

  // --- Customer & Project Details ---
  const startY = 45;
  doc.setFontSize(10);
  doc.setTextColor(0);

  // Left Column
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Details:', 15, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${customerName}`, 15, startY + 6);
  doc.text(`Phone: ${(sale as any).customer?.phone || 'N/A'}`, 15, startY + 12);
  doc.text(`Booking Date: ${new Date(sale.sale_date).toLocaleDateString()}`, 15, startY + 18);

  // Right Column
  doc.setFont('helvetica', 'bold');
  doc.text('Property Details:', 120, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${(sale as any).project?.name || 'N/A'}`, 120, startY + 6);
  doc.text(`Unit Number: ${unitNo}`, 120, startY + 12);
  doc.text(`Area: ${sale.area_sqft} Sq.ft`, 120, startY + 18);

  // --- Financial Summary Box ---
  const summaryY = startY + 28;
  const totalRevenue = sale.total_revenue || 0;
  const totalReceived = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balance = totalRevenue - totalReceived;

  // Draw Box
  doc.setFillColor(248, 250, 252); // Slate-50 like
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, summaryY, 180, 25, 3, 3, 'FD');

  // Summary Content
  doc.setFontSize(11);
  
  // Total Value
  doc.text('Total Sale Value', 30, summaryY + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs. ${totalRevenue.toLocaleString()}`, 30, summaryY + 18);

  // Received
  doc.setFont('helvetica', 'normal');
  doc.text('Total Received', 90, summaryY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74); // Green
  doc.text(`Rs. ${totalReceived.toLocaleString()}`, 90, summaryY + 18);

  // DUE
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text('Balance Due', 150, summaryY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Red
  doc.text(`Rs. ${balance.toLocaleString()}`, 150, summaryY + 18);
  doc.setTextColor(0); // Reset

  const tableData: string[][] = [];
  
  payments.forEach(p => {
    tableData.push([
        new Date(p.payment_date).toLocaleDateString(),
        `${p.payment_type?.toUpperCase().replace('_', ' ')} (${p.payment_mode?.toUpperCase().replace('_', ' ')})\nRef: ${p.transaction_reference || '-'}`,
        `Rs. ${Number(p.amount).toLocaleString()}`
    ]);
  });

  autoTable(doc, {
    startY: summaryY + 35,
    head: [['Date', 'Particulars / Reference', 'Credit Amount']],
    body: tableData,
    foot: [['', 'Total Amount Received', `Rs. ${totalReceived.toLocaleString()}`]],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' }, // Slate-800
    footStyles: { fillColor: [241, 245, 249], textColor: 0, fontStyle: 'bold' }, // Slate-100
    columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 'auto' }, // Description takes remaining
        2: { cellWidth: 40, halign: 'right' },
    },
    didDrawPage: (data) => {
        // Footer on each page
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Wishluv Buildcon Pvt Ltd - Payment Ledger', 15, pageHeight - 10);
        doc.text(`Page ${data.pageNumber}`, 195, pageHeight - 10, { align: 'right' });
    }
  });

  // Footer Note
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Note: This statement is computer generated and valid without signature.', 105, finalY, { align: 'center' });
  doc.text('For any discrepancies, please contact the accounts department.', 105, finalY + 5, { align: 'center' });

  return doc;
};

export const exportPaymentLedgerPDF = (sale: Sale, payments: Payment[]) => {
  const doc = generateLedgerDoc(sale, payments);
  const customerName = (sale as any).customer?.name || 'Customer';
  const unitNo = sale.unit_number || 'N/A';
  doc.save(`Ledger_${customerName.replace(/\s+/g, '_')}_Unit${unitNo}.pdf`);
};

export const sharePaymentLedger = async (sale: Sale, payments: Payment[]) => {
  const doc = generateLedgerDoc(sale, payments);
  const blob = doc.output('blob');
  const customerName = (sale as any).customer?.name || 'Customer';
  const unitNo = sale.unit_number || 'N/A';
  const fileName = `Ledger_${customerName.replace(/\s+/g, '_')}_Unit${unitNo}.pdf`;
  const file = new File([blob], fileName, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Payment Ledger',
        text: `Payment Ledger for ${customerName} - Unit ${unitNo}`,
      });
    } catch (error) {
       console.error('Error sharing:', error);
       alert('Share failed or was cancelled.');
    }
  } else {
    // Fallback: If share API not available (e.g. desktop), just download or alert
    // Since we provided a separate Download button, we can just say not supported on this device
    alert('Sharing files is not supported on this device/browser. Please download the PDF and share manually.');
  }
};

export const exportPaymentLedgerExcel = (sale: Sale, payments: Payment[]) => {
    const customerName = (sale as any).customer?.name || 'Customer';
    const unitNo = sale.unit_number || 'N/A';
    
    // Prepare Data for Sheet
    const data = [
        ['Payment Ledger'],
        ['Wishluv Buildcon Pvt Ltd'],
        [''],
        ['Customer Name', customerName, 'Project', (sale as any).project?.name || ''],
        ['Phone', (sale as any).customer?.phone || '', 'Unit No', unitNo],
        ['Sale Date', new Date(sale.sale_date).toLocaleDateString(), 'Area', `${sale.area_sqft} Sq.ft`],
        [''],
        ['Financial Summary'],
        ['Total Sale Value', sale.total_revenue],
        ['Total Received', payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)],
        ['Balance Due', (sale.total_revenue || 0) - payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)],
        [''],
        ['Payment History'],
        ['Date', 'Type', 'Mode', 'Reference', 'Amount', 'Remarks'],
    ];

    payments.forEach(p => {
        data.push([
            new Date(p.payment_date).toLocaleDateString(),
            p.payment_type,
            p.payment_mode,
            p.transaction_reference || '',
            p.amount,
            p.remarks || ''
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger');

    XLSX.writeFile(wb, `Ledger_${customerName}_Unit${unitNo}.xlsx`);
};
