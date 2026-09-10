import React, { useState } from 'react';
import { X, Link2, Check, Copy, FileSpreadsheet, Sparkles } from 'lucide-react';
import {
  getAppsScriptUrl,
  setAppsScriptUrl,
  getGoogleFormUrl,
  setGoogleFormUrl,
  getExpenseSheetUrl,
  setExpenseSheetUrl,
} from '../../../services/liveSheetService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const GoogleSheetsSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [webhookUrlInput, setWebhookUrlInput] = useState(getAppsScriptUrl());
  const [googleFormUrlInput, setGoogleFormUrlInput] = useState(getGoogleFormUrl());
  const [expenseSheetUrlInput, setExpenseSheetUrlInput] = useState(getExpenseSheetUrl());
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedExpenseTemplate, setCopiedExpenseTemplate] = useState(false);
  const [savedWebhookMsg, setSavedWebhookMsg] = useState(false);
  const [savedFormMsg, setSavedFormMsg] = useState(false);
  const [savedExpenseMsg, setSavedExpenseMsg] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="ganesh-modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="ganesh-modal-content"
        style={{
          maxWidth: '860px',
          width: '95%',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '20px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="ganesh-modal-header"
          style={{
            background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
            padding: '1.15rem 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🔗</span>
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: 800 }}>
                Google Sheets Live Sync Setup
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#a7f3d0' }}>
                Real-time Webhook, Form Submission &amp; Expense Sheet Integration
              </span>
            </div>
          </div>
          <button
            type="button"
            className="ganesh-modal-close-btn"
            onClick={onClose}
            title="Close Setup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="ganesh-modal-body" style={{ padding: '1.5rem', background: '#f8fafc' }}>
          <div style={{ background: '#ecfdf5', padding: '1.25rem', borderRadius: '14px', border: '1.5px solid #a7f3d0', marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.35rem 0', color: '#065f46', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '1rem' }}>
              <Sparkles size={18} color="#059669" /> Connect Live Form Submission to Google Sheet
            </h4>
            <p style={{ margin: 0, color: '#047857', fontSize: '0.86rem', lineHeight: '1.5' }}>
              When residents submit their <strong>Gothram &amp; Family Details</strong> from the app, it can automatically append a new row in your <strong>Gothram for pooja (Responses)</strong> Google Sheet.
            </p>
          </div>

          {/* Option A: Google Apps Script Webhook */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #cbd5e1', marginBottom: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.45rem', fontSize: '0.9rem' }}>
              Option A: Google Apps Script Webhook URL (For Direct App Submission):
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                className="ganesh-form-input"
                style={{ flex: '1 1 280px' }}
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
                style={{ background: '#059669', color: '#ffffff', padding: '0.6rem 1.3rem', whiteSpace: 'nowrap', borderRadius: '10px' }}
              >
                {savedWebhookMsg ? <Check size={16} /> : null}
                <span>{savedWebhookMsg ? 'Saved!' : 'Save URL'}</span>
              </button>
            </div>
            {savedWebhookMsg && (
              <div style={{ color: '#059669', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.45rem' }}>
                ✓ Webhook URL saved! Forms will now submit directly into your Google Sheet.
              </div>
            )}
          </div>

          {/* Option B: Google Form URL */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #cbd5e1', marginBottom: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: '0.45rem', fontSize: '0.9rem' }}>
              Option B: Official Google Form URL (For Embedding &amp; Direct Link):
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="url"
                placeholder="https://docs.google.com/forms/d/e/.../viewform?usp=dialog"
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
                  setTimeout(() => setSavedFormMsg(false), 3000);
                }}
                className="btn-festive-primary"
                style={{ background: '#2563eb', color: '#ffffff', padding: '0.6rem 1.3rem', whiteSpace: 'nowrap', borderRadius: '10px' }}
              >
                {savedFormMsg ? <Check size={16} /> : null}
                <span>{savedFormMsg ? 'Saved!' : 'Save Form URL'}</span>
              </button>
            </div>
            {savedFormMsg && (
              <div style={{ color: '#2563eb', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.45rem' }}>
                ✓ Official Google Form URL saved! Residents can open or view it directly in the app.
              </div>
            )}
          </div>

          {/* Option C: Live Expense Google Sheet URL */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #cbd5e1', marginBottom: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
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
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                className="ganesh-form-input"
                style={{ flex: '1 1 280px' }}
                value={expenseSheetUrlInput}
                onChange={(e) => setExpenseSheetUrlInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  setExpenseSheetUrl(expenseSheetUrlInput);
                  setSavedExpenseMsg(true);
                  onRefreshData?.();
                  setTimeout(() => setSavedExpenseMsg(false), 3000);
                }}
                className="btn-festive-primary"
                style={{ background: '#e11d48', color: '#ffffff', padding: '0.6rem 1.3rem', whiteSpace: 'nowrap', borderRadius: '10px' }}
              >
                {savedExpenseMsg ? <Check size={16} /> : null}
                <span>{savedExpenseMsg ? 'Connected & Synced!' : 'Connect & Sync'}</span>
              </button>
            </div>
            {savedExpenseMsg && (
              <div style={{ color: '#e11d48', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.45rem' }}>
                ✓ Expense Sheet connected! Live expenses and balance are now calculating automatically.
              </div>
            )}
          </div>

          {/* 3-Step Setup Instructions */}
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '1.25rem', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
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
              <li>Copy the generated <strong>Web app URL</strong> and paste it into Option A above!</li>
            </ol>
          </div>

          {/* Master Save All & Connect Button */}
          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '1.25rem',
            }}
          >
            <div>
              {(savedWebhookMsg || savedFormMsg || savedExpenseMsg) && (
                <span style={{ color: '#047857', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Check size={16} /> Configuration saved in browser storage!
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-festive-secondary"
                style={{ padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.88rem' }}
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setAppsScriptUrl(webhookUrlInput);
                  setGoogleFormUrl(googleFormUrlInput);
                  setExpenseSheetUrl(expenseSheetUrlInput);
                  setSavedWebhookMsg(true);
                  setSavedFormMsg(true);
                  setSavedExpenseMsg(true);
                  onRefreshData?.();
                  setTimeout(() => {
                    setSavedWebhookMsg(false);
                    setSavedFormMsg(false);
                    setSavedExpenseMsg(false);
                  }, 4000);
                }}
                className="btn-festive-primary"
                style={{
                  background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                  color: '#ffffff',
                  padding: '0.65rem 1.5rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                }}
              >
                <Check size={18} />
                <span>Save All &amp; Connect Live Sheets</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
