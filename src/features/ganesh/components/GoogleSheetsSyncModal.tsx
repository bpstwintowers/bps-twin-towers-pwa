import React, { useState } from 'react';
import { X, Check, Copy, FileSpreadsheet, Sparkles, ExternalLink, Code, Heart } from 'lucide-react';
import {
  getContributionsSheetUrl,
  setContributionsSheetUrl,
  getGothramSheetUrl,
  setGothramSheetUrl,
  setExpenseSheetUrl,
  getMasterPortalSheetUrl,
  setMasterPortalSheetUrl,
  getCulturalAppsScriptUrl,
  setCulturalAppsScriptUrl,
  setExpensesAppsScriptUrl,
  getGoogleFormUrl,
  setGoogleFormUrl,
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
  const [contribSheetInput, setContribSheetInput] = useState(getContributionsSheetUrl());
  const [gothramSheetInput, setGothramSheetInput] = useState(getGothramSheetUrl());
  const [masterPortalInput, setMasterPortalInput] = useState(getMasterPortalSheetUrl());
  const [webhookInput, setWebhookInput] = useState(getCulturalAppsScriptUrl());
  const [googleFormInput, setGoogleFormInput] = useState(getGoogleFormUrl());

  const [copiedMasterScript, setCopiedMasterScript] = useState(false);
  const [savedAllMsg, setSavedAllMsg] = useState(false);

  if (!isOpen) return null;

  const handleSaveAll = () => {
    setContributionsSheetUrl(contribSheetInput);
    setGothramSheetUrl(gothramSheetInput);
    setExpenseSheetUrl(masterPortalInput);
    setMasterPortalSheetUrl(masterPortalInput);
    setCulturalAppsScriptUrl(webhookInput);
    setExpensesAppsScriptUrl(webhookInput);
    setGoogleFormUrl(googleFormInput);

    setSavedAllMsg(true);
    onRefreshData?.();
    setTimeout(() => {
      setSavedAllMsg(false);
    }, 3500);
  };

  const unifiedMasterScriptCode = `/**
 * BPS Ganesh Utsav 2026 - Unified Master Portal Webhook
 * Spreadsheet: BPS Ganesh Utsav 2026 Master Portal
 * Tabs: Events, Event Team, Cultural, Prasadam, Expenses
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    
    // 1. Handle Expenses (saveExpense / updateExpense / deleteExpense)
    if (data.action === 'saveExpense' || data.action === 'updateExpense' || data.action === 'deleteExpense' || data.category || data.amount) {
      var expSheet = ss.getSheetByName('Expenses') || ss.insertSheet('Expenses');
      var lastRow = expSheet.getLastRow();
      
      // Look for existing row by invoice number or matching title+paidTo
      var targetRow = -1;
      if (lastRow > 1 && (data.originalInvoiceNo || data.invoiceNo || data.title)) {
        var values = expSheet.getRange(1, 1, lastRow, 10).getValues();
        var searchInv = (data.originalInvoiceNo || data.invoiceNo || '').toString().trim().toLowerCase();
        var searchTitle = (data.title || '').toString().trim().toLowerCase();
        var searchPaidTo = (data.paidTo || '').toString().trim().toLowerCase();
        
        for (var r = 1; r < values.length; r++) {
          var rowInv = (values[r][8] || '').toString().trim().toLowerCase(); // Col 9 (Invoice)
          var rowTitle = (values[r][1] || '').toString().trim().toLowerCase(); // Col 2 (Title)
          var rowPaidTo = (values[r][4] || '').toString().trim().toLowerCase(); // Col 5 (PaidTo)
          
          if (searchInv && rowInv && rowInv === searchInv) {
            targetRow = r + 1;
            break;
          } else if (searchTitle && rowTitle === searchTitle && (!searchPaidTo || rowPaidTo === searchPaidTo)) {
            targetRow = r + 1;
            break;
          }
        }
      }
      
      // Delete Action
      if (data.action === 'deleteExpense') {
        if (targetRow !== -1) {
          expSheet.deleteRow(targetRow);
          return ContentService.createTextOutput(
            JSON.stringify({ status: 'success', message: 'Expense row deleted successfully' })
          ).setMimeType(ContentService.MimeType.JSON);
        }
        return ContentService.createTextOutput(
          JSON.stringify({ status: 'not_found', message: 'Expense row not found to delete' })
        ).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Update Existing Row in place
      if (targetRow !== -1 && (data.action === 'updateExpense' || data.originalInvoiceNo)) {
        expSheet.getRange(targetRow, 1, 1, 10).setValues([[
          targetRow - 1,
          data.title || '',
          data.category || 'Other Festival Expenses',
          data.amount || 0,
          data.paidTo || '',
          data.paymentMode || 'UPI',
          data.expenseDate || new Date().toISOString().split('T')[0],
          data.status || 'Paid',
          data.invoiceNo || ('INV-' + new Date().getTime()),
          data.notes || ''
        ]]);
        
        return ContentService.createTextOutput(
          JSON.stringify({ status: 'success', message: 'Expense record updated successfully', row: targetRow })
        ).setMimeType(ContentService.MimeType.JSON);
      }
      
      // Otherwise: Append New Row
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

  return (
    <div className="ganesh-modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="ganesh-modal-content"
        style={{
          maxWidth: '880px',
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
            <FileSpreadsheet size={24} color="#fef08a" />
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem', fontWeight: 800 }}>
                Google Sheets &amp; Webhook Integration Portal
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#a7f3d0' }}>
                BPS Ganesh Utsav 2026 • Live Sync Feeds &amp; Master Portal Webhook
              </span>
            </div>
          </div>
          <button
            type="button"
            className="ganesh-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="ganesh-modal-body" style={{ padding: '1.4rem', background: '#f8fafc' }}>
          {/* 1. Contributions & Sponsors Sheet */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid #a7f3d0', marginBottom: '1.15rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ background: '#ecfdf5', padding: '0.35rem', borderRadius: '8px' }}>
                  <Heart size={18} color="#059669" />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '0.96rem' }}>
                    1. Contributions &amp; Sponsors Ledger (Live Sheet)
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Community donations, sponsorships, tower totals &amp; payment modes
                  </span>
                </div>
              </div>

              <a
                href={contribSheetInput}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>Open Sheet</span> <ExternalLink size={13} />
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
                  setSavedAllMsg(true);
                  onRefreshData?.();
                  setTimeout(() => setSavedAllMsg(false), 2500);
                }}
                className="btn-festive-primary"
                style={{ background: '#047857', color: '#ffffff', padding: '0.55rem 1.15rem', borderRadius: '10px', fontSize: '0.84rem' }}
              >
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* 2. Gothram & Archana Sankalpam */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid #fed7aa', marginBottom: '1.15rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ background: '#fff7ed', padding: '0.35rem', borderRadius: '8px' }}>
                  <Sparkles size={18} color="#ea580c" />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '0.96rem' }}>
                    2. Gothram &amp; Archana Sankalpam (Official Google Form &amp; Responses Sheet)
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Registrations managed exclusively via Google Form • PWA reads verified responses live
                  </span>
                </div>
              </div>

              <a
                href={gothramSheetInput}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>Open Responses Sheet</span> <ExternalLink size={13} />
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
                    setSavedAllMsg(true);
                    onRefreshData?.();
                    setTimeout(() => setSavedAllMsg(false), 2500);
                  }}
                  className="btn-festive-primary"
                  style={{ background: '#ea580c', color: '#ffffff', padding: '0.55rem 1.15rem', borderRadius: '10px', fontSize: '0.84rem' }}
                >
                  <span>Save</span>
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
                  value={googleFormInput}
                  onChange={(e) => setGoogleFormInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setGoogleFormUrl(googleFormInput);
                    setSavedAllMsg(true);
                    setTimeout(() => setSavedAllMsg(false), 2500);
                  }}
                  className="btn-festive-primary"
                  style={{ background: '#0284c7', color: '#ffffff', padding: '0.55rem 1.15rem', borderRadius: '10px', fontSize: '0.84rem' }}
                >
                  <span>Save Form</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Master Festival Portal Sheet (Events, Team, Cultural, Prasadam, Expenses) */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid #0284c7', marginBottom: '1.15rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ background: '#e0f2fe', padding: '0.35rem', borderRadius: '8px' }}>
                  <FileSpreadsheet size={18} color="#0284c7" />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '0.96rem' }}>
                    3. Master Festival Portal Sheet (Events, Team, Cultural, Prasadam, Expenses)
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Central unified spreadsheet with 5 synchronized tabs: Schedule, Event Team, Cultural lineup, Daily Prasadam &amp; Expenses Ledger
                  </span>
                </div>
              </div>

              <a
                href={masterPortalInput}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>Open Master Portal</span> <ExternalLink size={13} />
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
                  setSavedAllMsg(true);
                  onRefreshData?.();
                  setTimeout(() => setSavedAllMsg(false), 2500);
                }}
                className="btn-festive-primary"
                style={{ background: '#0284c7', color: '#ffffff', padding: '0.55rem 1.15rem', borderRadius: '10px', fontSize: '0.84rem' }}
              >
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* 4. Unified Master Google Apps Script Webhook */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid #ddd6fe', marginBottom: '1.15rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ background: '#f5f3ff', padding: '0.35rem', borderRadius: '8px' }}>
                  <Code size={18} color="#7c3aed" />
                </div>
                <div>
                  <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '0.96rem' }}>
                    4. Master Google Apps Script Webhook (Cultural &amp; Expenses)
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Unified webhook deployed on Master Portal to automatically append live Cultural registrations and Expense additions
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(unifiedMasterScriptCode);
                  setCopiedMasterScript(true);
                  setTimeout(() => setCopiedMasterScript(false), 3000);
                }}
                className="filter-chip-btn"
                style={{ background: '#f5f3ff', borderColor: '#c4b5fd', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', padding: '0.25rem 0.6rem', fontWeight: 700 }}
              >
                {copiedMasterScript ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                <span>{copiedMasterScript ? 'Copied Master Script!' : 'Copy Master Script Code'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                className="ganesh-form-input"
                style={{ flex: '1 1 280px' }}
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  setCulturalAppsScriptUrl(webhookInput);
                  setExpensesAppsScriptUrl(webhookInput);
                  setSavedAllMsg(true);
                  setTimeout(() => setSavedAllMsg(false), 2500);
                }}
                className="btn-festive-primary"
                style={{ background: '#7c3aed', color: '#ffffff', padding: '0.55rem 1.15rem', borderRadius: '10px', fontSize: '0.84rem' }}
              >
                <span>Save Webhook</span>
              </button>
            </div>
          </div>

          {/* Master Save All & Connect Button */}
          <div
            style={{
              marginTop: '1.25rem',
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
              {savedAllMsg && (
                <span style={{ color: '#047857', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Check size={16} /> All Google Sheets &amp; Webhook URLs saved and synced!
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
                onClick={handleSaveAll}
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
                <span>Save All Settings &amp; Connect Live</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

