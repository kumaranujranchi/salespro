import React, { useState } from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Send, 
  Calculator, 
  Building2, 
  CheckCircle2, 
  Calendar,
  Percent,
  CreditCard
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface UnitCostSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: any;
  project: any;
}

export function UnitCostSheetModal({ isOpen, onClose, unit, project }: UnitCostSheetModalProps) {
  const { tenant } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'cost_sheet' | 'demand_letter'>('cost_sheet');

  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Unit Specifications & Calculations
  const area = parseFloat(unit?.custom_values?.super_builtup_area || unit?.custom_values?.area || '1200') || 1200;
  const [ratePerSqFt, setRatePerSqFt] = useState<number>(parseFloat(unit?.custom_values?.rate_sqft || unit?.custom_values?.rate || '4500') || 4500);
  const [floorRisePerSqFt, setFloorRisePerSqFt] = useState<number>(50);
  const [plcPerSqFt, setPlcPerSqFt] = useState<number>(150);
  const [carParkingCharges, setCarParkingCharges] = useState<number>(250000);
  const [clubMembership, setClubMembership] = useState<number>(100000);
  const [infraCharges, setInfraCharges] = useState<number>(75000); // Electricity, water, generator
  const [gstPercent, setGstPercent] = useState<number>(5);
  const [stampDutyPercent, setStampDutyPercent] = useState<number>(6);

  // Demand Letter Specifics
  const [milestoneStage, setMilestoneStage] = useState('Completion of 4th Floor Slab');
  const [demandAmount, setDemandAmount] = useState<number>(350000);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('50200088991122');
  const [ifscCode, setIfscCode] = useState('HDFC0001234');
  const [accountHolder, setAccountHolder] = useState(tenant?.name || 'Real Estate Developer Escrow A/C');

  // Computed Financials
  const basePrice = area * ratePerSqFt;
  const floorRise = area * floorRisePerSqFt;
  const plc = area * plcPerSqFt;
  const agreementValue = basePrice + floorRise + plc;
  const otherChargesTotal = carParkingCharges + clubMembership + infraCharges;
  const totalConsideration = agreementValue + otherChargesTotal;
  const gstAmount = Math.round((agreementValue * gstPercent) / 100);
  const stampDutyAmount = Math.round((agreementValue * stampDutyPercent) / 100);
  const grandTotal = totalConsideration + gstAmount + stampDutyAmount;

  // Standard Construction-Linked Payment Milestones
  const paymentSchedule = [
    { stage: 'At the time of Booking / Token', percent: 10, amount: Math.round(agreementValue * 0.10) },
    { stage: 'Within 30 Days / Agreement Signing', percent: 10, amount: Math.round(agreementValue * 0.10) },
    { stage: 'On Completion of Plinth / Foundation', percent: 15, amount: Math.round(agreementValue * 0.15) },
    { stage: 'On Casting of Ground Floor Slab', percent: 10, amount: Math.round(agreementValue * 0.10) },
    { stage: 'On Casting of Mid-Floor Slab (4th/5th)', percent: 15, amount: Math.round(agreementValue * 0.15) },
    { stage: 'On Completion of Brickwork & Internal Plaster', percent: 15, amount: Math.round(agreementValue * 0.15) },
    { stage: 'On Completion of Flooring & External Paint', percent: 15, amount: Math.round(agreementValue * 0.15) },
    { stage: 'On Notice of Possession & Key Handover', percent: 10, amount: Math.round(agreementValue * 0.10) },
  ];

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Generate & Download Branded Cost Sheet PDF
  const handleDownloadCostSheetPDF = () => {
    try {
      const doc = new jsPDF();
      const companyName = tenant?.name || 'RealSalePro Real Estate';
      const projectName = project?.name || 'Residential Project';
      const unitNum = unit?.unit_number || 'Unit';

      // Header Banner
      doc.setFillColor(16, 185, 129); // RealSalePro Emerald Green
      doc.rect(0, 0, 210, 32, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName.toUpperCase(), 14, 16);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Official Unit Cost Sheet & Quotation | ${projectName}`, 14, 25);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 155, 25);

      // Property & Prospect Details
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('UNIT & PROSPECT DOSSIER', 14, 42);

      autoTable(doc, {
        startY: 46,
        theme: 'grid',
        headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
        body: [
          ['Project Name:', projectName, 'Unit Number:', unitNum],
          ['Super Built-up Area:', `${area} sq.ft.`, 'Unit Status:', unit?.status || 'Available'],
          ['Prospect Name:', customerName || 'Valued Buyer', 'Contact Phone:', customerPhone || 'Not Specified']
        ]
      });

      // Cost Breakdown Table
      const finalY1 = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PRICING BREAKDOWN', 14, finalY1);

      autoTable(doc, {
        startY: finalY1 + 4,
        theme: 'striped',
        head: [['Component', 'Rate / Details', 'Amount (INR)']],
        body: [
          ['Base Consideration', `${area} sq.ft. @ ₹${ratePerSqFt}/sq.ft.`, formatINR(basePrice)],
          ['Floor Rise Charges', `₹${floorRisePerSqFt}/sq.ft.`, formatINR(floorRise)],
          ['Preferred Location Charges (PLC)', `₹${plcPerSqFt}/sq.ft.`, formatINR(plc)],
          ['Total Agreement Value (A)', 'Base + PLC + Floor Rise', formatINR(agreementValue)],
          ['Covered Car Parking', '1 Reserved Space', formatINR(carParkingCharges)],
          ['Clubhouse & Fitness Membership', 'Lifetime Membership', formatINR(clubMembership)],
          ['Electricity, Water & Infra Charges', 'Statutory Connection Fee', formatINR(infraCharges)],
          ['Total Other Charges (B)', 'Parking + Club + Infra', formatINR(otherChargesTotal)],
          ['Estimated GST (5%)', 'Payable to Government', formatINR(gstAmount)],
          ['Estimated Stamp Duty & Reg. (6%)', 'Payable at Registration', formatINR(stampDutyAmount)],
        ],
        foot: [
          ['GRAND TOTAL (All-Inclusive)', 'Agreement + Other Charges + Taxes', formatINR(grandTotal)]
        ],
        footStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 }
      });

      // Construction-Linked Payment Milestones
      const finalY2 = (doc as any).lastAutoTable.finalY + 8;
      if (finalY2 < 240) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('CONSTRUCTION-LINKED PAYMENT SCHEDULE (CLP)', 14, finalY2);

        autoTable(doc, {
          startY: finalY2 + 4,
          theme: 'grid',
          head: [['Milestone Stage', 'Percentage (%)', 'Amount Due (INR)']],
          body: paymentSchedule.map(p => [p.stage, `${p.percent}%`, formatINR(p.amount)])
        });
      }

      // Footer Notes
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Note: Stamp Duty & Registration charges are indicative and subject to prevailing government rates at the time of execution.', 14, 285);

      doc.save(`CostSheet_${projectName}_${unitNum}.pdf`);
      toast.success('Cost sheet PDF downloaded successfully!');
    } catch (err: any) {
      console.error('Error generating Cost Sheet PDF:', err);
      toast.error('Failed to generate PDF: ' + err.message);
    }
  };

  // Generate & Download Demand Letter PDF
  const handleDownloadDemandLetterPDF = () => {
    try {
      const doc = new jsPDF();
      const companyName = tenant?.name || 'RealSalePro Real Estate';
      const projectName = project?.name || 'Residential Project';
      const unitNum = unit?.unit_number || 'Unit';

      // Header Banner
      doc.setFillColor(30, 41, 59); // Slate Dark Header
      doc.rect(0, 0, 210, 36, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName.toUpperCase(), 14, 16);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('OFFICIAL PAYMENT DEMAND NOTICE (CONSTRUCTION MILESTONE)', 14, 26);
      doc.text(`Notice Ref: DEM-${Date.now().toString().slice(-6)}`, 140, 26);

      // Letter Body
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 46);
      doc.text(`To:`, 14, 54);
      doc.setFont('helvetica', 'bold');
      doc.text(`${customerName || 'Allottee / Homebuyer'}`, 14, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(`Unit Number: ${unitNum} | Project: ${projectName}`, 14, 66);
      if (customerPhone) doc.text(`Phone: ${customerPhone}`, 14, 72);

      doc.setFont('helvetica', 'bold');
      doc.text(`Subject: Payment Demand for Milestone: "${milestoneStage}"`, 14, 84);

      doc.setFont('helvetica', 'normal');
      const letterText = `Dear Allottee,

We are pleased to inform you that construction work at ${projectName} is progressing on schedule. We have successfully achieved the construction milestone: "${milestoneStage}".

As per the Construction-Linked Payment (CLP) agreement executed between us, the installment for this milestone is now due. Please find the payment details below:`;
      doc.text(letterText, 14, 92, { maxWidth: 182 });

      // Demand Amount Table
      autoTable(doc, {
        startY: 124,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
        body: [
          ['Milestone Description:', milestoneStage],
          ['Demand Amount Due:', formatINR(demandAmount)],
          ['Due Date for Payment:', new Date(dueDate).toLocaleDateString('en-IN')],
        ]
      });

      // Bank Payment Coordinates
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('REMITTANCE BANK ACCOUNT DETAILS (NEFT / RTGS / CHEQUE)', 14, finalY);

      autoTable(doc, {
        startY: finalY + 4,
        theme: 'striped',
        body: [
          ['Account Holder Name:', accountHolder],
          ['Bank Name:', bankName],
          ['Account Number:', accountNumber],
          ['IFSC Code:', ifscCode],
          ['Branch Name:', 'Corporate Branch']
        ]
      });

      const finalYBank = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Kindly arrange to remit the installment amount on or before the due date to avoid interest on delayed payment. After remitting, kindly share the UTR / Cheque transaction slip with our accounts department.', 14, finalYBank, { maxWidth: 182 });

      doc.text(`For and on behalf of ${companyName}:`, 14, finalYBank + 20);
      doc.setFont('helvetica', 'bold');
      doc.text('Authorized Signatory / Accounts Manager', 14, finalYBank + 34);

      doc.save(`DemandLetter_${unitNum}_${milestoneStage.replace(/\s+/g, '_')}.pdf`);
      toast.success('Demand letter notice downloaded successfully!');
    } catch (err: any) {
      console.error('Error generating Demand Letter:', err);
      toast.error('Failed to generate demand letter: ' + err.message);
    }
  };

  // Share via WhatsApp
  const handleShareWhatsApp = (type: 'cost_sheet' | 'demand_letter') => {
    const unitNum = unit?.unit_number || 'Unit';
    const projectName = project?.name || 'Property';
    let text = '';

    if (type === 'cost_sheet') {
      text = `*Official Cost Sheet & Quotation - ${projectName}*\n` +
        `Unit: *${unitNum}* (${area} sq.ft.)\n` +
        `Base Rate: ₹${ratePerSqFt}/sq.ft.\n` +
        `Agreement Value: *${formatINR(agreementValue)}*\n` +
        `Parking & Amenities: *${formatINR(otherChargesTotal)}*\n` +
        `Taxes (GST & Stamp Duty): *${formatINR(gstAmount + stampDutyAmount)}*\n` +
        `--------------------------\n` +
        `*Grand Total (All-Inclusive): ${formatINR(grandTotal)}*\n\n` +
        `10% Booking Token: *${formatINR(Math.round(agreementValue * 0.10))}*\n\n` +
        `Detailed schedule and branded PDF quotation have been generated for you. Contact us for unit lock or site visit!`;
    } else {
      text = `*Official Payment Demand Notice - ${projectName}*\n` +
        `Unit: *${unitNum}*\n` +
        `Milestone Achieved: *${milestoneStage}*\n` +
        `Amount Due: *${formatINR(demandAmount)}*\n` +
        `Due Date: *${new Date(dueDate).toLocaleDateString('en-IN')}*\n\n` +
        `*Bank Remittance Details:*\n` +
        `A/C: ${accountNumber} (${bankName})\n` +
        `IFSC: ${ifscCode}\n\n` +
        `Please share the transaction UTR reference once remitted. Thank you!`;
    }

    const cleanPhone = (customerPhone || '').replace(/\D/g, '');
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Builder Documentation — Unit ${unit?.unit_number || ''}`}>
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('cost_sheet')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'cost_sheet'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Cost Sheet &amp; Quotation
          </button>
          <button
            onClick={() => setActiveTab('demand_letter')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'demand_letter'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            Construction Demand Letter
          </button>
        </div>

        {/* Prospect Details Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Prospect / Buyer Name</label>
            <Input
              placeholder="e.g. Rahul Sharma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">WhatsApp / Phone Number</label>
            <Input
              placeholder="e.g. 9876543210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
        </div>

        {activeTab === 'cost_sheet' ? (
          /* ================= COST SHEET TAB ================= */
          <div className="space-y-6">
            {/* Input Config Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Base Rate (₹/sq.ft.)</label>
                <Input
                  type="number"
                  value={ratePerSqFt}
                  onChange={(e) => setRatePerSqFt(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Floor Rise (₹/sq.ft.)</label>
                <Input
                  type="number"
                  value={floorRisePerSqFt}
                  onChange={(e) => setFloorRisePerSqFt(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">PLC (₹/sq.ft.)</label>
                <Input
                  type="number"
                  value={plcPerSqFt}
                  onChange={(e) => setPlcPerSqFt(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Car Parking (₹)</label>
                <Input
                  type="number"
                  value={carParkingCharges}
                  onChange={(e) => setCarParkingCharges(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Clubhouse Fee (₹)</label>
                <Input
                  type="number"
                  value={clubMembership}
                  onChange={(e) => setClubMembership(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">GST Rate (%)</label>
                <Input
                  type="number"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total Agreement Value:</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{formatINR(agreementValue)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Parking &amp; Other Amenities:</span>
                <span>{formatINR(otherChargesTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Govt Taxes (GST {gstPercent}% + Stamp Duty {stampDutyPercent}%):</span>
                <span>{formatINR(gstAmount + stampDutyAmount)}</span>
              </div>
              <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-400">Grand Total (All-Inclusive)</div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatINR(grandTotal)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">10% Booking Token</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-100">{formatINR(Math.round(agreementValue * 0.10))}</div>
                </div>
              </div>
            </div>

            {/* CLP Schedule Preview */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Construction-Linked Milestones</h4>
              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {paymentSchedule.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 px-3">
                    <span className="text-slate-700 dark:text-slate-300">{p.stage}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{p.percent}%</Badge>
                      <span className="font-semibold text-slate-900 dark:text-white">{formatINR(p.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ================= DEMAND LETTER TAB ================= */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Construction Milestone Achieved</label>
                <Input
                  value={milestoneStage}
                  onChange={(e) => setMilestoneStage(e.target.value)}
                  placeholder="e.g. Completion of 4th Floor Slab"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Installment Due Amount (₹)</label>
                <Input
                  type="number"
                  value={demandAmount}
                  onChange={(e) => setDemandAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Payment Due Date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Remittance Bank Name</label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Escrow / Project Account Number</label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Bank IFSC Code</label>
                <Input
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4 rounded-xl text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> Official Demand Notice
              </div>
              <p>This generates an official RERA-compliant milestone demand notice with your project details, installment amount, due date, and bank coordinates.</p>
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {activeTab === 'cost_sheet' ? (
              <>
                <Button variant="outline" onClick={() => handleShareWhatsApp('cost_sheet')} className="flex items-center gap-1.5 text-emerald-600 border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                  <Send className="w-4 h-4" /> Share on WhatsApp
                </Button>
                <Button onClick={handleDownloadCostSheetPDF} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="w-4 h-4" /> Download Cost Sheet (PDF)
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleShareWhatsApp('demand_letter')} className="flex items-center gap-1.5 text-blue-600 border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                  <Send className="w-4 h-4" /> Share on WhatsApp
                </Button>
                <Button onClick={handleDownloadDemandLetterPDF} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="w-4 h-4" /> Download Demand Notice (PDF)
                </Button>
              </>
            )}
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
