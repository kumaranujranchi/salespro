import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Sale, Payment, Tenant } from '../types/database';

/**
 * Resolves the tenant's company logo from all possible locations
 */
export const getTenantLogoUrl = (tenant?: Tenant | null): string | null => {
  if (!tenant) return null;
  return (
    (tenant.settings?.appearance as any)?.resolved_logo_url ||
    tenant.settings?.appearance?.logo_url ||
    tenant.settings?.company_profile?.logo_url ||
    (tenant as any).logo_url ||
    null
  );
};

/**
 * Pre-loads an image asynchronously via an HTML Canvas element
 * to guarantee CORS-safety and export a standard PNG Base64 data URL.
 */
export const loadImageAsDataUrl = async (
  url: string
): Promise<{ dataUrl: string; width: number; height: number } | null> => {
  if (!url || typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 120;
          canvas.height = img.naturalHeight || img.height || 120;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);

          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          resolve({
            dataUrl,
            width: canvas.width,
            height: canvas.height,
          });
        } catch (e) {
          console.warn('Canvas export error for logo:', e);
          resolve(null);
        }
      };

      img.onerror = () => {
        console.warn('Failed to load logo image:', url);
        resolve(null);
      };

      img.src = url;
    } catch {
      resolve(null);
    }
  });
};

// Helper to generate doc
const generateLedgerDoc = async (sale: Sale, payments: Payment[], tenant?: Tenant | null) => {
  const doc = new jsPDF();
  const customerName = (sale as any).customer?.name || (sale as any).lead_customer_name || 'Customer';
  const unitNo = sale.unit_number || 'N/A';
  
  // Header
  const companyProfile = tenant?.settings?.company_profile;
  const companyName = tenant?.name || 'Your Company';
  const rawLogoUrl = getTenantLogoUrl(tenant);
  
  let currentY = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  if (rawLogoUrl) {
    const logoData = await loadImageAsDataUrl(rawLogoUrl);
    if (logoData) {
      try {
        const maxW = 40; // mm
        const maxH = 18; // mm
        let finalW = maxW;
        let finalH = (logoData.height / logoData.width) * maxW;
        if (finalH > maxH) {
          finalH = maxH;
          finalW = (logoData.width / logoData.height) * maxH;
        }
        const xPos = (pageWidth - finalW) / 2;
        doc.addImage(logoData.dataUrl, 'PNG', xPos, currentY, finalW, finalH);
        currentY += finalH + 6;
      } catch (e) {
        console.warn('Failed to add logo to ledger:', e);
        currentY += 8;
      }
    } else {
      currentY += 6;
    }
  } else {
    currentY += 6;
  }

  // Centered Company Name
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, centerX, currentY, { align: 'center' });
  currentY += 8;

  // Centered Company Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  
  if (companyProfile) {
    if (companyProfile.address) {
      doc.text(companyProfile.address, centerX, currentY, { align: 'center' });
      currentY += 5;
    }
    const contactInfo = [];
    if (companyProfile.email) contactInfo.push(`Email: ${companyProfile.email}`);
    if (companyProfile.phone) contactInfo.push(`Phone: ${companyProfile.phone}`);
    if (contactInfo.length > 0) {
      doc.text(contactInfo.join(' | '), centerX, currentY, { align: 'center' });
      currentY += 5;
    }
    if (companyProfile.website) {
      doc.text(`Website: ${companyProfile.website}`, centerX, currentY, { align: 'center' });
      currentY += 5;
    }
    if (companyProfile.tax_id) {
      doc.text(`GSTIN/TAX: ${companyProfile.tax_id}`, centerX, currentY, { align: 'center' });
      currentY += 5;
    }
  } else if (tenant?.name) {
    doc.text('Authorized Statement', centerX, currentY, { align: 'center' });
    currentY += 5;
  } else {
    const fallbackTitle = tenant === undefined ? 'Tenant Context Undefined' : 'No Tenant Data';
    doc.text(fallbackTitle, centerX, currentY, { align: 'center' });
    currentY += 5;
  }

  // Divider Line
  const dividerY = currentY + 2;
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(15, dividerY, 195, dividerY);

  // --- Customer & Project Details ---
  const startY = dividerY + 10;
  doc.setFontSize(10);
  doc.setTextColor(0);

  // Left Column
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Details:', 15, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${customerName}`, 15, startY + 6);
  doc.text(`Phone: ${(sale as any).customer?.phone || (sale as any).lead_mobile || 'N/A'}`, 15, startY + 12);
  doc.text(`Booking Date: ${new Date(sale.sale_date).toLocaleDateString('en-IN')}`, 15, startY + 18);

  // Right Column (Aligned Right)
  doc.setFont('helvetica', 'bold');
  doc.text('Property Details:', 195, startY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${(sale as any).project?.name || (sale as any).project_name || 'N/A'}`, 195, startY + 6, { align: 'right' });
  doc.text(`Unit Number: ${unitNo}`, 195, startY + 12, { align: 'right' });
  doc.text(`Area: ${sale.area_sqft || 0} Sq.ft`, 195, startY + 18, { align: 'right' });

  // --- Financial Summary Box ---
  const summaryY = startY + 28;
  const totalRevenue = sale.total_revenue || 0;
  const totalReceived = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balance = totalRevenue - totalReceived;

  // Draw Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, summaryY, 180, 25, 3, 3, 'FD');

  // Summary Content
  doc.setFontSize(11);
  
  // Total Value
  doc.text('Total Sale Value', 30, summaryY + 10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rs ${totalRevenue.toLocaleString('en-IN')}`, 30, summaryY + 18);

  // Received
  doc.setFont('helvetica', 'normal');
  doc.text('Total Received', 90, summaryY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74); // Green
  doc.text(`Rs ${totalReceived.toLocaleString('en-IN')}`, 90, summaryY + 18);

  // DUE
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.text('Balance Due', 150, summaryY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Red
  doc.text(`Rs ${balance.toLocaleString('en-IN')}`, 150, summaryY + 18);
  doc.setTextColor(0); // Reset

  const tableData: string[][] = [];
  
  payments.forEach(p => {
    tableData.push([
        new Date(p.payment_date).toLocaleDateString('en-IN'),
        `${(p.payment_type || 'Payment').toUpperCase().replace('_', ' ')} (${(p.payment_mode || 'Cash').toUpperCase().replace('_', ' ')})\nRef: ${p.transaction_reference || '-'}`,
        `${Number(p.amount).toLocaleString('en-IN')}`
    ]);
  });

  autoTable(doc, {
    startY: summaryY + 35,
    head: [['Date', 'Particulars / Reference', 'Credit Amount (INR)']],
    body: tableData,
    foot: [['', 'Total Amount Received', `Rs ${totalReceived.toLocaleString('en-IN')}`]],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: 0, fontStyle: 'bold' },
    columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 45, halign: 'right' },
    },
    didDrawPage: (data) => {
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`${companyName} - Payment Ledger`, 15, pageHeight - 10);
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

export const exportPaymentLedgerPDF = async (sale: Sale, payments: Payment[], tenant?: Tenant | null) => {
  const doc = await generateLedgerDoc(sale, payments, tenant);
  const customerName = (sale as any).customer?.name || (sale as any).lead_customer_name || 'Customer';
  const unitNo = sale.unit_number || 'N/A';
  doc.save(`Ledger_${customerName.replace(/\s+/g, '_')}_Unit${unitNo}.pdf`);
};

export const sharePaymentLedger = async (sale: Sale, payments: Payment[], tenant?: Tenant | null) => {
  const doc = await generateLedgerDoc(sale, payments, tenant);
  const blob = doc.output('blob');
  const customerName = (sale as any).customer?.name || (sale as any).lead_customer_name || 'Customer';
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
    alert('Sharing files is not supported on this device/browser. Please download the PDF and share manually.');
  }
};

export const exportPaymentLedgerExcel = (sale: Sale, payments: Payment[], tenant?: Tenant | null) => {
    const customerName = (sale as any).customer?.name || (sale as any).lead_customer_name || 'Customer';
    const unitNo = sale.unit_number || 'N/A';
    const companyName = tenant?.name || 'Your Company';
    
    const data = [
        ['Payment Ledger'],
        [companyName],
        [''],
        ['Customer Name', customerName, 'Project', (sale as any).project?.name || (sale as any).project_name || ''],
        ['Phone', (sale as any).customer?.phone || (sale as any).lead_mobile || '', 'Unit No', unitNo],
        ['Sale Date', new Date(sale.sale_date).toLocaleDateString('en-IN'), 'Area', `${sale.area_sqft || 0} Sq.ft`],
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
            new Date(p.payment_date).toLocaleDateString('en-IN'),
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

/**
 * Generates and downloads a dedicated Single-Payment Receipt PDF with Company Logo
 */
export const exportPaymentReceiptPDF = async (payment: Payment, sale: Sale, tenant?: Tenant | null) => {
  const doc = new jsPDF();
  const customerName = (sale as any).customer?.name || (sale as any).lead_customer_name || 'Customer';
  const customerPhone = (sale as any).customer?.phone || (sale as any).lead_mobile || 'N/A';
  const projectName = (sale as any).project?.name || (sale as any).project_name || 'N/A';
  const unitNo = sale.unit_number || 'N/A';
  const companyProfile = tenant?.settings?.company_profile;
  const companyName = tenant?.name || 'Your Company';
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  let currentY = 15;
  const rawLogoUrl = getTenantLogoUrl(tenant);
  if (rawLogoUrl) {
    const logoData = await loadImageAsDataUrl(rawLogoUrl);
    if (logoData) {
      try {
        const maxW = 38;
        const maxH = 16;
        let finalW = maxW;
        let finalH = (logoData.height / logoData.width) * maxW;
        if (finalH > maxH) {
          finalH = maxH;
          finalW = (logoData.width / logoData.height) * maxH;
        }
        const xPos = (pageWidth - finalW) / 2;
        doc.addImage(logoData.dataUrl, 'PNG', xPos, currentY, finalW, finalH);
        currentY += finalH + 6;
      } catch (e) {
        currentY += 6;
      }
    } else {
      currentY += 6;
    }
  } else {
    currentY += 6;
  }

  // Company Name
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, centerX, currentY, { align: 'center' });
  currentY += 6;

  // Company address / contact
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  if (companyProfile?.address) {
    doc.text(companyProfile.address, centerX, currentY, { align: 'center' });
    currentY += 5;
  }
  const contact = [];
  if (companyProfile?.phone) contact.push(`Phone: ${companyProfile.phone}`);
  if (companyProfile?.email) contact.push(`Email: ${companyProfile.email}`);
  if (companyProfile?.tax_id) contact.push(`GSTIN: ${companyProfile.tax_id}`);
  if (contact.length > 0) {
    doc.text(contact.join(' | '), centerX, currentY, { align: 'center' });
    currentY += 5;
  }

  // Title Box: OFFICIAL PAYMENT RECEIPT
  currentY += 3;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(15, currentY, 180, 8, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL PAYMENT RECEIPT', centerX, currentY + 5.5, { align: 'center' });
  currentY += 14;

  // Receipt Meta (Receipt No & Date)
  const pId = String((payment as any).id || (payment as any)._id || Date.now());
  const receiptNo = `RCP-${pId.slice(-8).toUpperCase()}`;
  const paymentDate = new Date(payment.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt No: ${receiptNo}`, 15, currentY);
  doc.text(`Date: ${paymentDate}`, 195, currentY, { align: 'right' });
  currentY += 8;

  // Details Grid: Customer & Property
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, currentY, 180, 26, 2, 2, 'FD');

  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  // Left Column
  doc.setFont('helvetica', 'bold');
  doc.text('Received With Thanks From:', 20, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${customerName}`, 20, currentY + 14);
  doc.text(`Phone: ${customerPhone}`, 20, currentY + 20);

  // Right Column
  doc.setFont('helvetica', 'bold');
  doc.text('Property Details:', 115, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Project: ${projectName}`, 115, currentY + 14);
  doc.text(`Unit No: ${unitNo} (${sale.area_sqft || 0} Sq.ft)`, 115, currentY + 20);
  currentY += 32;

  // Payment Particulars Table
  const amountNum = Number(payment.amount) || 0;
  autoTable(doc, {
    startY: currentY,
    head: [['Particulars', 'Payment Mode', 'Reference / Cheque No', 'Amount Received']],
    body: [
      [
        `${String(payment.payment_type || 'Installment').toUpperCase()} PAYMENT\n${payment.remarks || '-'}`,
        String(payment.payment_mode || 'Cash').toUpperCase(),
        payment.transaction_reference || '-',
        `Rs ${amountNum.toLocaleString('en-IN')}`
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 35 },
      2: { cellWidth: 40 },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    }
  });

  const tableFinalY = (doc as any).lastAutoTable.finalY;
  currentY = tableFinalY + 8;

  // Amount in Figures Banner
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, currentY, 180, 10, 2, 2, 'F');
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Total Amount Received: Rs ${amountNum.toLocaleString('en-IN')}`, 20, currentY + 6.5);
  currentY += 16;

  // Signatory & Notes Box
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('* Subject to realization of cheque / online fund clearance.', 15, currentY);
  doc.text('* This statement is computer generated and valid without physical signature.', 15, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`For ${companyName}`, 195, currentY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signatory / Accounts Dept', 195, currentY + 12, { align: 'right' });

  doc.save(`Receipt_${receiptNo}_${customerName.replace(/\s+/g, '_')}.pdf`);
};

/**
 * 1-Click WhatsApp Receipt Sharing via Direct Deep Link
 */
export const sharePaymentReceiptWhatsApp = (payment: Payment, sale: Sale, tenant?: Tenant | null) => {
  const customerName = (sale as any).customer?.name || (sale as any).lead_customer_name || 'Valued Customer';
  const customerPhone = (sale as any).customer?.phone || (sale as any).lead_mobile || '';
  const projectName = (sale as any).project?.name || (sale as any).project_name || 'Project';
  const unitNo = sale.unit_number || 'N/A';
  const companyName = tenant?.name || 'Accounts Department';
  const amount = Number(payment.amount) || 0;
  const paymentDate = new Date(payment.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const mode = String(payment.payment_mode || 'Payment').toUpperCase();
  const ref = payment.transaction_reference ? ` (Ref: ${payment.transaction_reference})` : '';

  const cleanPhone = customerPhone.replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('91') ? cleanPhone : cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const text = 
`*PAYMENT RECEIPT - ${companyName.toUpperCase()}*
----------------------------------------
Dear *${customerName}*,

We gratefully acknowledge receipt of your payment with thanks:

*Receipt Details:*
• Project: *${projectName}*
• Unit No: *${unitNo}*
• Amount Received: *Rs ${amount.toLocaleString('en-IN')}*
• Payment Mode: *${mode}*${ref}
• Date: *${paymentDate}*

Thank you for your trust and timely payment!
_${companyName} - Accounts & Collections_`;

  const url = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

/**
 * Exports Pending Collections / Outstanding balance sheet into an Excel file
 */
export const exportCollectionsExcel = (
  items: Array<{
    customerName: string;
    customerPhone: string;
    projectName: string;
    unitNumber: string;
    saleDate: string;
    totalRevenue: number;
    totalReceived: number;
    balanceDue: number;
    lastPaymentDate?: string;
    executiveName?: string;
  }>,
  tenant?: Tenant | null
) => {
  const companyName = tenant?.name || 'Company';
  const rows = [
    [`${companyName} - Outstanding Collections & Recovery Sheet`],
    [`Generated on: ${new Date().toLocaleDateString('en-IN')}`],
    [''],
    [
      'Customer Name',
      'Mobile Number',
      'Project',
      'Unit No',
      'Booking Date',
      'Total Sale Value (INR)',
      'Total Received (INR)',
      'Balance Due (INR)',
      'Last Payment Date',
      'Sales Executive'
    ]
  ];

  items.forEach(i => {
    rows.push([
      i.customerName,
      i.customerPhone,
      i.projectName,
      i.unitNumber,
      i.saleDate,
      i.totalRevenue as any,
      i.totalReceived as any,
      i.balanceDue as any,
      i.lastPaymentDate || 'No payments yet',
      i.executiveName || 'Unassigned'
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Outstanding Collections');
  XLSX.writeFile(workbook, `Collections_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
