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
  getCulturalAppsScriptUrl,
  setCulturalAppsScriptUrl,
  getExpensesAppsScriptUrl,
  setExpensesAppsScriptUrl,
  getGoogleFormUrl,
  setGoogleFormUrl,
  getExpenseSheetUrl,
  setExpenseSheetUrl,
  getMasterPortalSheetUrl,
  setMasterPortalSheetUrl,
  getContributionsSheetUrl,
  setContributionsSheetUrl,
  getGothramSheetUrl,
  setGothramSheetUrl,
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

  const [culturalWebhookInput, setCulturalWebhookInput] = useState(getCulturalAppsScriptUrl());
  const [expenseWebhookInput, setExpenseWebhookInput] = useState(getExpensesAppsScriptUrl());
  const [googleFormUrlInput, setGoogleFormUrlInput] = useState(getGoogleFormUrl());
  const [expenseSheetUrlInput, setExpenseSheetUrlInput] = useState(getExpenseSheetUrl());
  const [masterPortalInput, setMasterPortalInput] = useState(getMasterPortalSheetUrl());
  const [contribSheetInput, setContribSheetInput] = useState(getContributionsSheetUrl());
  const [gothramSheetInput, setGothramSheetInput] = useState(getGothramSheetUrl());

  const [copiedCulturalScript, setCopiedCulturalScript] = useState(false);
  const [copiedExpenseScript, setCopiedExpenseScript] = useState(false);
  const [copiedExpenseTemplate, setCopiedExpenseTemplate] = useState(false);
  const [savedCulturalWebhookMsg, setSavedCulturalWebhookMsg] = useState(false);
  const [savedExpenseWebhookMsg, setSavedExpenseWebhookMsg] = useState(false);
  const [savedFormMsg, setSavedFormMsg] = useState(false);
  const [savedExpenseMsg, setSavedExpenseMsg] = useState(false);
  const [savedMasterPortalMsg, setSavedMasterPortalMsg] = useState(false);
  const [savedContribMsg, setSavedContribMsg] = useState(false);
  const [savedGothramMsg, setSavedGothramMsg] = useState(false);

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 1. Contributions & Sponsors */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid #a7f3d0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '0.96rem' }}>
                  1. Contributions &amp; Sponsors Ledger (Live Sheet)
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Community donations, sponsorships, tower totals &amp; payment modes
                </span>
              </div>
              <a
                href={contribSheetInput}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>Open Sheet</span> <Link2 size={13} />
              </a>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=960844894"
                className="ganesh-form-input"
                style={{ flex: '1 1 280px' }}
                value={contribSheetInput}
                onChange={(e) => setContribSheetInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  setContributionsSheetUrl(contribSheetInput);
                  setSavedContribMsg(true);
                  onRefresh();
                  setTimeout(() => setSavedContribMsg(false), 2500);
                }}
                className="btn-festive-primary"
                style={{ background: '#047857', color: '#ffffff', padding: '0.55rem 1.15rem', borderRadius: '10px', fontSize: '0.84rem' }}
              >
                {savedContribMsg ? <Check size={14} /> : null}
                <span>{savedContribMsg ? 'Saved!' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* 2. Gothram & Archana Sankalpam */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid #fed7aa', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '0.96rem' }}>
                  2. Gothram &amp; Archana Sankalpam (Official Google Form &amp; Responses Sheet)
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Managed exclusively via Official Google Form • App reads live responses feed
                </span>
              </div>
              <a
                href={gothramSheetInput}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>Open Responses Sheet</span> <Link2 size={13} />
              </a>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                Google Sheets CSV Feed URL:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=984412802"
                  className="ganesh-form-input"
                  style={{ flex: '1 1 280px' }}
                  value={gothramSheetInput}
                  onChange={(e) => setGothramSheetInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setGothramSheetUrl(gothramSheetInput);
                    setSavedGothramMsg(true);
                    onRefresh();
                    setTimeout(() => setSavedGothramMsg(false), 2500);
                  }}
                  className="btn-festive-primary"
                  style={{ background: '#ea580c', color: '#ffffff', padding: '0.55rem 1.15rem', borderRadius: '10px', fontSize: '0.84rem' }}
                >
                  {savedGothramMsg ? <Check size={14} /> : null}
                  <span>{savedGothramMsg ? 'Saved!' : 'Save'}</span>
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                Official Google Form URL (For Resident Self-Registration):
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="url"
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  className="ganesh-form-input"
                  style={{ flex: '1 1 280px' }}
                  value={googleFormUrlInput}
                  onChange={(e) => setGoogleFormUrlInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setGoogleFormUrl(googleFormUrlInput);
                    setSavedFormMsg(true);
                    setTimeout(() => setSavedFormMsg(false), 2500);
                  }}
                  className="btn-festive-primary"
                  style={{ background: '#0284c7', color: '#ffffff', padding: '0.55rem 1.15rem', borderRadius: '10px', fontSize: '0.84rem' }}
                >
                  {savedFormMsg ? <Check size={14} /> : null}
                  <span>{savedFormMsg ? 'Saved Form!' : 'Save Form'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Master Festival Portal Sheet (Events, Team, Cultural, Prasadam, Expenses) */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid #0284c7', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '0.96rem' }}>
                  3. Master Festival Portal Sheet (Events, Team, Cultural, Prasadam, Expenses)
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Central community spreadsheet with 5 synchronized tabs for Schedule, Event Team, Cultural lineup, Daily Prasadam &amp; Expenses Ledger
                </span>
              </div>
              <a
                href={masterPortalInput}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>Open Master Portal</span> <Link2 size={13} />
              </a>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/19wJOLle-co42OSM083JZWSrD_IIAOy6wUmoWsRVeM1M/edit"
                className="ganesh-form-input"
                style={{ flex: '1 1 280px' }}
                value={masterPortalInput}
                onChange={(e) => setMasterPortalInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  setMasterPortalSheetUrl(masterPortalInput);
                  setExpenseSheetUrl(masterPortalInput);
                  setSavedMasterPortalMsg(true);
                  onRefresh();
                  setTimeout(() => setSavedMasterPortalMsg(false), 2500);
                }}
                className="btn-festive-primary"
                style={{ background: '#0284c7', color: '#ffffff', padding: '0.55rem 1.15rem', borderRadius: '10px', fontSize: '0.84rem' }}
              >
                {savedMasterPortalMsg ? <Check size={14} /> : null}
                <span>{savedMasterPortalMsg ? 'Saved!' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* 4. Master Google Apps Script Webhook (Live Cultural & Expenses) */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid #ddd6fe', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '0.96rem' }}>
                  4. Master Google Apps Script Webhook (Cultural &amp; Expenses)
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Unified webhook deployed on Master Portal to automatically append live Cultural registrations and Expense additions
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const masterCode = `/**
 * BPS Ganesh Utsav 2026 - Unified Master Portal Webhook
 * Spreadsheet: BPS Ganesh Utsav 2026 Master Portal
 * Tabs: Events, Event Team, Cultural, Prasadam, Expenses
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    
    // 1. Handle Expenses Appending (action === 'saveExpense')
    if (data.action === 'saveExpense' || data.category || data.amount) {
      var expSheet = ss.getSheetByName('Expenses') || ss.insertSheet('Expenses');
      var lastRow = expSheet.getLastRow();
      var nextSlNo = lastRow > 0 ? lastRow : 1;
      
      expSheet.appendRow([
        nextSlNo,
        data.title || '',
        data.category || 'Other Festival Expenses',
        data.amount || 0,
        data.paidTo || '',
        data.paymentMode || 'UPI',
        data.expenseDate || new Date().toISOString().split('T')[0],
        data.status || 'Paid',
        data.invoiceNo || ('INV-' + new Date().getTime()),
        data.notes || ''
      ]);
      
      return ContentService.createTextOutput(
        JSON.stringify({ status: 'success', message: 'Expense record saved successfully', slNo: nextSlNo })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. Handle Cultural Registrations (Default / Cultural action)
    var culturalSheet = ss.getSheetByName('Cultural') || ss.insertSheet('Cultural');
    culturalSheet.appendRow([
      data.preferredDate || new Date().toISOString().split('T')[0],
      'Slot Pending Confirmation',
      (data.actType || 'Performance') + ' - ' + (data.fullName || 'Resident'),
      data.duration || '15 Mins',
      (data.fullName || '') + ' (' + (data.mobile || '') + ')',
      data.flatNo || '',
      data.actType || 'Cultural Performance',
      data.description || 'Registered via BPS PWA'
    ]);
    
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success', message: 'Cultural registration saved successfully' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}`;
                  navigator.clipboard.writeText(masterCode);
                  setCopiedCulturalScript(true);
                  setTimeout(() => setCopiedCulturalScript(false), 3000);
                }}
                className="filter-chip-btn"
                style={{ background: '#f5f3ff', borderColor: '#c4b5fd', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', padding: '0.25rem 0.6rem', fontWeight: 700 }}
              >
                {copiedCulturalScript ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                <span>{copiedCulturalScript ? 'Copied Master Script!' : 'Copy Master Script Code'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                className="ganesh-form-input"
                style={{ flex: '1 1 280px' }}
                value={culturalWebhookInput}
                onChange={(e) => setCulturalWebhookInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  setCulturalAppsScriptUrl(culturalWebhookInput);
                  setExpensesAppsScriptUrl(culturalWebhookInput);
                  setSavedCulturalWebhookMsg(true);
                  setTimeout(() => setSavedCulturalWebhookMsg(false), 2500);
                }}
                className="btn-festive-primary"
                style={{ background: '#7c3aed', color: '#ffffff', padding: '0.55rem 1.15rem', borderRadius: '10px', fontSize: '0.84rem' }}
              >
                {savedCulturalWebhookMsg ? <Check size={14} /> : null}
                <span>{savedCulturalWebhookMsg ? 'Saved Webhook!' : 'Save Webhook'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
