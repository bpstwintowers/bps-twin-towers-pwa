import React, { useState } from 'react';
import {
  Download,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Link2,
} from 'lucide-react';
import type {
  GaneshContributionRecord,
  GaneshExpenseRecord,
  GaneshSankalpamRecord,
  GaneshContributionType,
  GaneshPaymentMode,
  GaneshExpenseCategory,
} from '../../../types/ganesh';
import {
  addGaneshContribution,
  addGaneshExpense,
  exportGaneshCollectionsCSV,
  exportGaneshExpensesCSV,
  exportGaneshSankalpamCSV,
  getAppsScriptUrl,
  setAppsScriptUrl,
  getGoogleFormUrl,
  setGoogleFormUrl,
  getExpenseSheetUrl,
  setExpenseSheetUrl,
} from '../../../services/liveSheetService';

interface Props {
  contributions: GaneshContributionRecord[];
  expenses: GaneshExpenseRecord[];
  sankalpams: GaneshSankalpamRecord[];
  onRefresh: () => void;
  selectedForm?: 'contribution' | 'sponsor' | 'expense' | 'sync';
}

export const GaneshAdminPanel: React.FC<Props> = ({
  contributions,
  expenses,
  sankalpams,
  onRefresh,
  selectedForm,
}) => {
  const [activeForm, setActiveForm] = useState<'contribution' | 'sponsor' | 'expense' | 'sync'>(
    selectedForm || 'sync'
  );

  React.useEffect(() => {
    if (selectedForm) {
      setActiveForm(selectedForm);
    }
  }, [selectedForm]);

  const [webhookUrlInput, setWebhookUrlInput] = useState(getAppsScriptUrl());
  const [googleFormUrlInput, setGoogleFormUrlInput] = useState(getGoogleFormUrl());
  const [expenseSheetUrlInput, setExpenseSheetUrlInput] = useState(getExpenseSheetUrl());
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedExpenseTemplate, setCopiedExpenseTemplate] = useState(false);
  const [savedWebhookMsg, setSavedWebhookMsg] = useState(false);
  const [savedFormMsg, setSavedFormMsg] = useState(false);
  const [savedExpenseMsg, setSavedExpenseMsg] = useState(false);

  // Contribution / Sponsor Form State
  const [donorName, setDonorName] = useState('');
  const [flatNo, setFlatNo] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<GaneshPaymentMode>('UPI');
  const [contributionType, setContributionType] = useState<GaneshContributionType>('General Contribution');
  const [sponsorCategory, setSponsorCategory] = useState('Pooja Item Sponsor');
  const [notes, setNotes] = useState('');
  const [transRef, setTransRef] = useState('');

  // Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<GaneshExpenseCategory>('Pandal & Decoration');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expInvoiceNo, setExpInvoiceNo] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  const handleRecordContribution = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(amount);
    if (!donorName.trim() || !flatNo.trim() || isNaN(amtNum) || amtNum <= 0) {
      alert('Please fill all required fields with valid values');
      return;
    }

    const isSponsor = activeForm === 'sponsor';

    addGaneshContribution({
      donorName: donorName.trim(),
      flatNo: flatNo.trim().toUpperCase(),
      amount: amtNum,
      contributionType: isSponsor ? (contributionType as any) : 'General Contribution',
      isSponsor,
      sponsorCategory: isSponsor ? sponsorCategory : undefined,
      paymentMode,
      transactionRef: transRef.trim() || undefined,
      notes: notes.trim() || undefined,
      verified: true,
    });

    setNotification(`Successfully recorded ${isSponsor ? 'Sponsor' : 'Contribution'} of ₹${amtNum.toLocaleString('en-IN')} for ${donorName} (${flatNo})`);
    
    // Reset
    setDonorName('');
    setFlatNo('');
    setAmount('');
    setNotes('');
    setTransRef('');
    onRefresh();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amtNum = parseFloat(expAmount);
    if (!expTitle.trim() || isNaN(amtNum) || amtNum <= 0) {
      alert('Please fill valid expense title and amount');
      return;
    }

    addGaneshExpense({
      title: expTitle.trim(),
      category: expCategory,
      amount: amtNum,
      paidTo: expPaidTo.trim() || 'Vendor',
      paymentMode: 'UPI',
      expenseDate: expDate,
      invoiceNo: expInvoiceNo.trim() || undefined,
      notes: expNotes.trim() || undefined,
      approvedBy: 'Event Admin Team',
      status: 'Paid',
      createdAt: new Date().toISOString(),
    });

    setNotification(`Successfully recorded expense of ₹${amtNum.toLocaleString('en-IN')} for "${expTitle}"`);
    setExpTitle('');
    setExpAmount('');
    setExpPaidTo('');
    setExpInvoiceNo('');
    setExpNotes('');
    onRefresh();
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDownloadAll = () => {
    // Export all 3 datasets
    const collectionsCSV = exportGaneshCollectionsCSV(contributions);
    const expensesCSV = exportGaneshExpensesCSV(expenses);
    const sankalpamCSV = exportGaneshSankalpamCSV(sankalpams);

    const zipBlob = new Blob([
      `=== GANESH UTSAV CONTRIBUTIONS & SPONSORS ===\n${collectionsCSV}\n\n\n=== EXPENSES LEDGER ===\n${expensesCSV}\n\n\n=== GOTHRAM & FAMILY MEMBERS ===\n${sankalpamCSV}`
    ], { type: 'text/plain;charset=utf-8;' });

    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BPS_Ganesh_Utsav_Complete_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.3rem 0', color: '#1e293b', fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="#ea580c" /> Event Team & Committee Console
          </h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
            Enter offline contributions, manage special sponsorships, record vendor invoices, and configure Google Sheets live sync.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="filter-chip-btn"
            onClick={handleDownloadAll}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0f172a', color: '#ffffff', borderColor: '#0f172a' }}
          >
            <Download size={15} /> Export Complete Audit Pack
          </button>
        </div>
      </div>

      {notification && (
        <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} color="#059669" />
          <span>{notification}</span>
        </div>
      )}

      {/* Mode Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`filter-chip-btn ${activeForm === 'contribution' ? 'active' : ''}`}
          onClick={() => setActiveForm('contribution')}
        >
          ➕ Record Resident Contribution
        </button>
        <button
          type="button"
          className={`filter-chip-btn ${activeForm === 'sponsor' ? 'active' : ''}`}
          onClick={() => setActiveForm('sponsor')}
          style={{
            background: activeForm === 'sponsor' ? '#b45309' : undefined,
            color: activeForm === 'sponsor' ? '#ffffff' : undefined,
          }}
        >
          🌟 Record Sponsor Entry
        </button>
        <button
          type="button"
          className={`filter-chip-btn ${activeForm === 'expense' ? 'active' : ''}`}
          onClick={() => setActiveForm('expense')}
          style={{
            background: activeForm === 'expense' ? '#be123c' : undefined,
            color: activeForm === 'expense' ? '#ffffff' : undefined,
          }}
        >
          🧾 Record Vendor Expense Bill
        </button>
        <button
          type="button"
          className={`filter-chip-btn ${activeForm === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveForm('sync')}
          style={{
            background: activeForm === 'sync' ? '#047857' : undefined,
            color: activeForm === 'sync' ? '#ffffff' : undefined,
          }}
        >
          🔗 Google Sheets Live Sync Setup
        </button>
      </div>

      {/* FORM: CONTRIBUTION OR SPONSOR */}
      {(activeForm === 'contribution' || activeForm === 'sponsor') && (
        <form onSubmit={handleRecordContribution} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 1.2rem 0', color: '#0f172a', fontWeight: 700 }}>
            {activeForm === 'sponsor' ? 'Enter Special Sponsor Details' : 'Enter Resident Contribution Details'}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="ganesh-form-group">
              <label className="ganesh-form-label">Resident / Sponsor Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Nagoju Praveen"
                className="ganesh-form-input"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
            </div>

            <div className="ganesh-form-group">
              <label className="ganesh-form-label">Flat No (or External) *</label>
              <input
                type="text"
                required
                placeholder="e.g. B606, A1701, External"
                className="ganesh-form-input"
                value={flatNo}
                onChange={(e) => setFlatNo(e.target.value)}
              />
            </div>

            <div className="ganesh-form-group">
              <label className="ganesh-form-label">Amount (₹) *</label>
              <input
                type="number"
                required
                min={1}
                placeholder="e.g. 5000"
                className="ganesh-form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="ganesh-form-group">
              <label className="ganesh-form-label">Payment Mode</label>
              <select
                className="ganesh-form-select"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
              >
                <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                <option value="Cash">Cash Collected</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {activeForm === 'sponsor' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="ganesh-form-group">
                <label className="ganesh-form-label">Sponsorship Category / Item</label>
                <select
                  className="ganesh-form-select"
                  value={sponsorCategory}
                  onChange={(e) => {
                    setSponsorCategory(e.target.value);
                    if (e.target.value.includes('Pooja')) setContributionType('Pooja Item');
                    else if (e.target.value.includes('Prasadam')) setContributionType('Mahaprasadam');
                    else if (e.target.value.includes('Pujari')) setContributionType('Pujari Dakshina');
                    else setContributionType('Other');
                  }}
                >
                  <option value="Pooja Item Sponsor">Pooja Item Sponsor</option>
                  <option value="Mahaprasadam Sponsor">Mahaprasadam Sponsor</option>
                  <option value="Pujari Sponsor">Pujari Sponsor</option>
                  <option value="Laddu Auction Sponsor">Laddu Auction Sponsor</option>
                  <option value="Flower & Stage Decoration Sponsor">Flower & Stage Decoration Sponsor</option>
                  <option value="Sound & Light Sponsor">Sound & Light Sponsor</option>
                  <option value="Visarjan & Dhol Band Sponsor">Visarjan & Dhol Band Sponsor</option>
                </select>
              </div>

              <div className="ganesh-form-group">
                <label className="ganesh-form-label">Sponsorship Notes / Item Details</label>
                <input
                  type="text"
                  placeholder="e.g. Sponsored complete daily Pooja samagri for 3 days"
                  className="ganesh-form-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="ganesh-form-group">
              <label className="ganesh-form-label">Transaction Reference / UTR (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 42938192801 or Cash handed over"
                className="ganesh-form-input"
                value={transRef}
                onChange={(e) => setTransRef(e.target.value)}
              />
            </div>

            <div className="ganesh-form-group">
              <label className="ganesh-form-label">Committee Remarks</label>
              <input
                type="text"
                placeholder="e.g. Verified by Festival Treasurer"
                className="ganesh-form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn-festive-primary" style={{ background: '#ea580c', color: '#ffffff' }}>
              Save & Update Live Collections
            </button>
          </div>
        </form>
      )}

      {/* FORM: EXPENSE */}
      {activeForm === 'expense' && (
        <form onSubmit={handleRecordExpense} style={{ background: '#fff1f2', padding: '1.5rem', borderRadius: '16px', border: '1px solid #fecdd3' }}>
          <h4 style={{ margin: '0 0 1.2rem 0', color: '#881337', fontWeight: 700 }}>
            Enter Festival Expenditure / Vendor Bill
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="ganesh-form-group">
              <label className="ganesh-form-label">Expense Title / Item *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dhol Tasha Procession Band Advance"
                className="ganesh-form-input"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
              />
            </div>

            <div className="ganesh-form-group">
              <label className="ganesh-form-label">Category</label>
              <select
                className="ganesh-form-select"
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value as any)}
              >
                <option value="Idol & Visarjan">Idol & Visarjan</option>
                <option value="Priest & Puja Samagri">Priest & Puja Samagri</option>
                <option value="Mahaprasadam & Food">Mahaprasadam & Food</option>
                <option value="Pandal & Decoration">Pandal & Decoration</option>
                <option value="Sound & Lighting">Sound & Lighting</option>
                <option value="Cultural Events & Gifts">Cultural Events & Gifts</option>
                <option value="Security & Cleaning">Security & Cleaning</option>
                <option value="Misc & Contingency">Misc & Contingency</option>
              </select>
            </div>

            <div className="ganesh-form-group">
              <label className="ganesh-form-label">Amount (₹) *</label>
              <input
                type="number"
                required
                min={1}
                placeholder="e.g. 18000"
                className="ganesh-form-input"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
              />
            </div>

            <div className="ganesh-form-group">
              <label className="ganesh-form-label">Vendor / Paid To</label>
              <input
                type="text"
                placeholder="e.g. Pune Dhol Tasha Pathak"
                className="ganesh-form-input"
                value={expPaidTo}
                onChange={(e) => setExpPaidTo(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="ganesh-form-group">
              <label className="ganesh-form-label">Invoice / Receipt No</label>
              <input
                type="text"
                placeholder="e.g. INV-BAND-009"
                className="ganesh-form-input"
                value={expInvoiceNo}
                onChange={(e) => setExpInvoiceNo(e.target.value)}
              />
            </div>

            <div className="ganesh-form-group">
              <label className="ganesh-form-label">Expense Date</label>
              <input
                type="date"
                className="ganesh-form-input"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
              />
            </div>

            <div className="ganesh-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="ganesh-form-label">Bill Description / Notes</label>
              <input
                type="text"
                placeholder="e.g. Includes 15 drummers and floral chariot escort"
                className="ganesh-form-input"
                value={expNotes}
                onChange={(e) => setExpNotes(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn-festive-primary" style={{ background: '#be123c', color: '#ffffff' }}>
              Save Expense Bill
            </button>
          </div>
        </form>
      )}

      {/* FORM: GOOGLE SHEETS SYNC SETUP */}
      {activeForm === 'sync' && (
        <div style={{ background: '#ecfdf5', padding: '1.5rem', borderRadius: '16px', border: '1px solid #a7f3d0' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#065f46', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Link2 size={18} color="#059669" /> Connect Live Form Submission to Google Sheet
          </h4>
          <p style={{ margin: '0 0 1.25rem 0', color: '#047857', fontSize: '0.88rem', lineHeight: '1.5' }}>
            When residents submit their <strong>Gothram & Family Details</strong> from the app, it can automatically append a new row in your <strong>Gothram for pooja (Responses)</strong> Google Sheet.
          </p>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.2rem', border: '1px solid #6ee7b7', marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              Option A: Google Apps Script Webhook URL (For Direct App Submission):
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                className="ganesh-form-input"
                style={{ flex: 1 }}
                value={webhookUrlInput}
                onChange={(e) => setWebhookUrlInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  setAppsScriptUrl(webhookUrlInput);
                  setSavedWebhookMsg(true);
                  setTimeout(() => setSavedWebhookMsg(false), 3000);
                }}
                className="btn-festive-primary"
                style={{ background: '#059669', color: '#ffffff', padding: '0.6rem 1.2rem', whiteSpace: 'nowrap' }}
              >
                {savedWebhookMsg ? <Check size={16} /> : null}
                <span>{savedWebhookMsg ? 'Saved!' : 'Save URL'}</span>
              </button>
            </div>
            {savedWebhookMsg && (
              <div style={{ color: '#059669', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.4rem' }}>
                ✓ Webhook URL saved! Forms will now submit directly into your Google Sheet.
              </div>
            )}
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.2rem', border: '1px solid #bfdbfe', marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              Option B: Official Google Form URL (For Embedding &amp; Direct Link):
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="url"
                placeholder="https://docs.google.com/forms/d/e/.../viewform"
                className="ganesh-form-input"
                style={{ flex: 1 }}
                value={googleFormUrlInput}
                onChange={(e) => setGoogleFormUrlInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  setGoogleFormUrl(googleFormUrlInput);
                  setSavedFormMsg(true);
                  setTimeout(() => setSavedFormMsg(false), 3000);
                }}
                className="btn-festive-primary"
                style={{ background: '#2563eb', color: '#ffffff', padding: '0.6rem 1.2rem', whiteSpace: 'nowrap' }}
              >
                {savedFormMsg ? <Check size={16} /> : null}
                <span>{savedFormMsg ? 'Saved!' : 'Save Form URL'}</span>
              </button>
            </div>
            {savedFormMsg && (
              <div style={{ color: '#2563eb', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.4rem' }}>
                ✓ Official Google Form URL saved! Residents can open or view it directly in the app.
              </div>
            )}
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.2rem', border: '1px solid #fecdd3', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontWeight: 700, color: '#881337', fontSize: '0.9rem' }}>
                Option C: Live Expense Google Sheet URL:
              </label>
              <button
                type="button"
                onClick={() => {
                  const csvTemplate = `Sl No,Expense Title,Category,Amount,Vendor / Paid To,Payment Mode,Date,Status,Invoice No,Notes
1,Eco-Friendly Clay Ganesh Idol Advance,Idol & Visarjan,18000,Dhoolpet Murti Arts,UPI,2026-09-06,Paid,REC-304,8-feet traditional clay idol booking
2,Pandal & Stage Decoration Setup,Pandal & Decoration,45000,Sri Balaji Pandal Works,Bank Transfer,2026-09-08,Paid,INV-7701,Advance 50% paid for 5 days shamiana
3,Daily Archana Flowers & Garlands,Priest & Puja Samagri,12500,Gudimalkapur Flower Market,Cash,2026-09-09,Paid,VCH-12,Bulk booking for 5 festival days
4,Mahaprasadam Laddu & Sweets,Mahaprasadam & Food,15000,Sri Krishna Sweets,UPI,2026-09-10,Paid,REC-902,Daily prasad distribution`;
                  navigator.clipboard.writeText(csvTemplate);
                  setCopiedExpenseTemplate(true);
                  setTimeout(() => setCopiedExpenseTemplate(false), 3000);
                }}
                className="filter-chip-btn"
                style={{ background: '#fff1f2', borderColor: '#fecdd3', color: '#9f1239', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              >
                {copiedExpenseTemplate ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                <span>{copiedExpenseTemplate ? 'Copied CSV Template!' : 'Copy Sheet Columns Template'}</span>
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                className="ganesh-form-input"
                style={{ flex: 1 }}
                value={expenseSheetUrlInput}
                onChange={(e) => setExpenseSheetUrlInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  setExpenseSheetUrl(expenseSheetUrlInput);
                  setSavedExpenseMsg(true);
                  onRefresh();
                  setTimeout(() => setSavedExpenseMsg(false), 3000);
                }}
                className="btn-festive-primary"
                style={{ background: '#e11d48', color: '#ffffff', padding: '0.6rem 1.2rem', whiteSpace: 'nowrap' }}
              >
                {savedExpenseMsg ? <Check size={16} /> : null}
                <span>{savedExpenseMsg ? 'Connected & Synced!' : 'Connect & Sync'}</span>
              </button>
            </div>
            {savedExpenseMsg && (
              <div style={{ color: '#e11d48', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.4rem' }}>
                ✓ Expense Sheet connected! Live expenses and balance are now calculating automatically.
              </div>
            )}
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.2rem', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                📋 3-Step Setup Instructions:
              </span>
              <button
                type="button"
                onClick={() => {
                  const scriptCode = `function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // 1. EXPENSES LIVE SAVE & UPDATE
    if (data.action === 'saveExpense') {
      var values = sheet.getDataRange().getValues();
      var foundRow = -1;
      
      for (var i = 1; i < values.length; i++) {
        var rowTitle = String(values[i][1] || '').trim().toLowerCase();
        var rowInv = String(values[i][8] || '').trim().toLowerCase();
        
        if ((data.invoiceNo && rowInv && rowInv === String(data.invoiceNo).trim().toLowerCase()) ||
            (rowTitle === String(data.title).trim().toLowerCase())) {
          foundRow = i + 1;
          break;
        }
      }
      
      if (foundRow !== -1) {
        sheet.getRange(foundRow, 2).setValue(data.title);
        sheet.getRange(foundRow, 3).setValue(data.category);
        sheet.getRange(foundRow, 4).setValue(data.amount);
        sheet.getRange(foundRow, 5).setValue(data.paidTo || '');
        sheet.getRange(foundRow, 6).setValue(data.paymentMode || 'UPI');
        sheet.getRange(foundRow, 7).setValue(data.expenseDate || '');
        sheet.getRange(foundRow, 8).setValue(data.status || 'Paid');
        sheet.getRange(foundRow, 9).setValue(data.invoiceNo || '');
        sheet.getRange(foundRow, 10).setValue(data.notes || '');
      } else {
        sheet.appendRow([
          values.length,
          data.title,
          data.category,
          data.amount,
          data.paidTo || '',
          data.paymentMode || 'UPI',
          data.expenseDate || '',
          data.status || 'Paid',
          data.invoiceNo || '',
          data.notes || ''
        ]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', type: 'expense' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. GOTHRAM / SANKALPAM SUBMISSION
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString('en-US'),
      data.block || '',
      data.flatNumber || '',
      data.poojaDate || 'All Festival Days',
      data.gothram || '',
      data.count || 1,
      data.names || '',
      data.primaryResident || ''
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', type: 'gothram' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                  navigator.clipboard.writeText(scriptCode);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 3000);
                }}
                className="filter-chip-btn"
                style={{ background: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              >
                {copiedScript ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                <span>{copiedScript ? 'Copied Code!' : 'Copy Script Code'}</span>
              </button>
            </div>

            <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#475569', lineHeight: '1.7' }}>
              <li>Open your <strong>Gothram for pooja (Responses)</strong> Google Sheet.</li>
              <li>Click <strong>Extensions</strong> &gt; <strong>Apps Script</strong> in the top menu.</li>
              <li>Delete any existing template text, paste the copied script code, and click <strong>Save</strong> (💾).</li>
              <li>Click <strong>Deploy</strong> (top right) &gt; <strong>New Deployment</strong>.</li>
              <li>Click the gear icon (⚙️) next to Select type &gt; Choose <strong>Web app</strong>.</li>
              <li>Set <em>Execute as:</em> <strong>Me</strong> and <em>Who has access:</em> <strong>Anyone</strong>, then click <strong>Deploy</strong>.</li>
              <li>Copy the generated <strong>Web app URL</strong> and paste it into the field above!</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
