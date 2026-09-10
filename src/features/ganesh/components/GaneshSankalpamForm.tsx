import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  Heart,
  CheckCircle2,
  X,
  ArrowLeft,
} from 'lucide-react';
import type {
  GaneshSankalpamRecord,
  GaneshFamilyMember,
  GaneshContributionRecord,
  GaneshExpenseRecord,
} from '../../../types/ganesh';
import {
  addOrUpdateGaneshSankalpam,
} from '../../../services/ganeshService';

interface Props {
  sankalpams: GaneshSankalpamRecord[];
  contributions?: GaneshContributionRecord[];
  expenses?: GaneshExpenseRecord[];
  onRefresh: () => void;
  userFlat?: string;
  userName?: string;
  activeViewMode?: 'families' | 'pujari' | 'expenses' | 'contributions';
  onViewModeChange?: (mode: 'families' | 'pujari' | 'expenses' | 'contributions') => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  onOpenAddModal?: () => void;
}

export const GaneshSankalpamForm: React.FC<Props> = ({
  sankalpams,
  contributions = [],
  expenses = [],
  onRefresh,
  userFlat = '',
  userName = '',
  activeViewMode,
  onViewModeChange,
  isAddModalOpen: externalIsAddModalOpen,
  onCloseAddModal,
  onOpenAddModal,
}) => {
  const [flatNo, setFlatNo] = useState(userFlat);
  const [primaryResidentName, setPrimaryResidentName] = useState(userName);
  const [gothram, setGothram] = useState('');

  // Dynamic Family Members
  const [members, setMembers] = useState<GaneshFamilyMember[]>([
    { id: '1', name: userName || '', relationship: 'Self' },
  ]);

  const [internalViewMode, setInternalViewMode] = useState<'families' | 'pujari' | 'expenses' | 'contributions'>('families');
  const [internalIsModalOpen, setInternalIsModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const viewMode = activeViewMode !== undefined ? activeViewMode : internalViewMode;
  const setViewMode = (mode: 'families' | 'pujari' | 'expenses' | 'contributions') => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
    setInternalViewMode(mode);
  };

  const isModalOpen = externalIsAddModalOpen !== undefined ? externalIsAddModalOpen : internalIsModalOpen;
  const setIsModalOpen = (open: boolean) => {
    if (open) {
      onOpenAddModal ? onOpenAddModal() : setInternalIsModalOpen(true);
    } else {
      onCloseAddModal ? onCloseAddModal() : setInternalIsModalOpen(false);
    }
  };

  const mySankalpam = useMemo(() => {
    if (!userFlat) return null;
    return sankalpams.find((s) => s.flatNo.trim().toUpperCase() === userFlat.trim().toUpperCase());
  }, [sankalpams, userFlat]);

  useEffect(() => {
    if (isModalOpen) {
      if (mySankalpam) {
        setFlatNo(mySankalpam.flatNo);
        setPrimaryResidentName(mySankalpam.primaryResidentName);
        setGothram(mySankalpam.gothram);
        setMembers(
          mySankalpam.familyMembers.length > 0
            ? mySankalpam.familyMembers
            : [{ id: '1', name: mySankalpam.primaryResidentName, relationship: 'Self' }]
        );
      } else {
        setFlatNo(userFlat || '');
        setPrimaryResidentName(userName || '');
        setGothram('');
        setMembers([{ id: '1', name: userName || '', relationship: 'Self' }]);
      }
    }
  }, [isModalOpen, mySankalpam, userFlat, userName]);

  const handleAddMember = () => {
    setMembers([
      ...members,
      {
        id: Date.now().toString(),
        name: '',
        relationship: 'Family Member',
      },
    ]);
  };

  const handleRemoveMember = (id: string) => {
    if (members.length === 1) {
      alert('At least one family member name is required.');
      return;
    }
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleMemberChange = (id: string, field: keyof GaneshFamilyMember, value: string) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatNo.trim()) {
      alert('Please provide your flat number (e.g. B901)');
      return;
    }
    if (!primaryResidentName.trim()) {
      alert('Please enter primary resident / Yajamana name');
      return;
    }
    if (!gothram.trim()) {
      alert('Please enter or select Gothram');
      return;
    }

    const validMembers = members.filter((m) => m.name.trim().length > 0);
    if (validMembers.length === 0) {
      alert('Please enter at least one family member name');
      return;
    }

    addOrUpdateGaneshSankalpam({
      flatNo: flatNo.trim().toUpperCase(),
      primaryResidentName: primaryResidentName.trim(),
      gothram: gothram.trim(),
      familyMembers: validMembers,
    });

    setIsSaved(true);
    onRefresh();
    setTimeout(() => {
      setIsSaved(false);
      setIsModalOpen(false);
    }, 1500);
  };

  const filteredSankalpams = sankalpams;

  const totalContributions = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const towerAContributions = contributions.filter((c) => c.tower === 'A');
  const towerBContributions = contributions.filter((c) => c.tower === 'B');
  const towerATotal = towerAContributions.reduce((s, c) => s + (c.amount || 0), 0);
  const towerBTotal = towerBContributions.reduce((s, c) => s + (c.amount || 0), 0);

  return (
    <div>
      {/* POPUP MODAL: ADD / UPDATE GOTHRAM & FAMILY */}
      {isModalOpen && (
        <div className="ganesh-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="ganesh-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px', width: '95%' }}
          >
            <div className="ganesh-modal-header" style={{ padding: '0.8rem 1.15rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#ffffff', margin: 0, fontSize: '1.02rem', fontWeight: 700 }}>
                <Sparkles size={17} color="#fef08a" />
                Add / Update Gothram & Family Details
              </h3>
              <button
                className="ganesh-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ganesh-modal-body">
              {isSaved ? (
                <div
                  style={{
                    background: '#d1fae5',
                    border: '1px solid #6ee7b7',
                    color: '#065f46',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    margin: '1rem 0',
                  }}
                >
                  <CheckCircle2 size={40} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                  <h4 style={{ margin: '0 0 0.4rem 0', color: '#065f46', fontSize: '1.2rem' }}>
                    Gothram Details Saved Successfully!
                  </h4>
                  <p style={{ margin: 0, color: '#047857', fontSize: '0.9rem' }}>
                    Flat {flatNo} registered with {gothram} Gothram for Ganesh Utsav 2026.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div className="ganesh-form-group">
                      <label className="ganesh-form-label">
                        Flat Number <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. B901, A1701"
                        className="ganesh-form-input"
                        value={flatNo}
                        onChange={(e) => setFlatNo(e.target.value)}
                      />
                    </div>

                    <div className="ganesh-form-group">
                      <label className="ganesh-form-label">
                        Primary Resident / Yajamana <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Karthik Behera"
                        className="ganesh-form-input"
                        value={primaryResidentName}
                        onChange={(e) => setPrimaryResidentName(e.target.value)}
                      />
                    </div>

                    <div className="ganesh-form-group">
                      <label className="ganesh-form-label">
                        Gothram <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kashyapa, Bharadwaja"
                        className="ganesh-form-input"
                        value={gothram}
                        onChange={(e) => setGothram(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Dynamic Family Members Section */}
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '14px',
                      padding: '1rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                        <Users size={17} /> Family Members for Gothram ({members.length})
                      </div>
                      <button
                        type="button"
                        onClick={handleAddMember}
                        className="btn-festive-secondary"
                        style={{
                          background: '#fef3c7',
                          color: '#b45309',
                          borderColor: '#fde68a',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.82rem',
                        }}
                      >
                        <Plus size={14} /> Add Member
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
                      {members.map((member, idx) => (
                        <div
                          key={member.id}
                          style={{
                            background: '#ffffff',
                            padding: '0.75rem',
                            borderRadius: '10px',
                            border: '1px solid #fed7aa',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#ffedd5',
                                color: '#9a3412',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {idx + 1}
                            </span>

                            <input
                              type="text"
                              required
                              placeholder="Full Name *"
                              className="ganesh-form-input"
                              style={{ flex: 1, padding: '0.45rem 0.6rem', fontSize: '0.88rem' }}
                              value={member.name}
                              onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                            />

                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              style={{
                                background: '#fee2e2',
                                border: 'none',
                                color: '#dc2626',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                padding: '0.4rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                              title="Remove Member"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', paddingLeft: '1.75rem' }}>
                            <select
                              className="ganesh-form-select"
                              style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem' }}
                              value={member.relationship || 'Self'}
                              onChange={(e) => handleMemberChange(member.id, 'relationship', e.target.value)}
                            >
                              <option value="Self">Self</option>
                              <option value="Spouse">Spouse</option>
                              <option value="Son">Son</option>
                              <option value="Daughter">Daughter</option>
                              <option value="Father">Father</option>
                              <option value="Mother">Mother</option>
                              <option value="Brother">Brother</option>
                              <option value="Sister">Sister</option>
                              <option value="Grandchild">Grandchild</option>
                              <option value="Family Member">Other</option>
                            </select>

                            <input
                              type="text"
                              placeholder="Nakshatram (Optional)"
                              className="ganesh-form-input"
                              style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                              value={member.nakshatram || ''}
                              onChange={(e) => handleMemberChange(member.id, 'nakshatram', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="ganesh-modal-cancel-btn"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-festive-primary"
                      style={{ background: '#ea580c', color: '#ffffff', padding: '0.7rem 1.6rem', borderRadius: '12px', border: 'none', fontWeight: 700 }}
                    >
                      <Heart size={16} /> Save Gothram Details
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PUJARI GOTHRAM PRINT SHEET */}
      {viewMode === 'pujari' && (
        <div className="sankalpam-printable-sheet" style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px' }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #fed7aa', paddingBottom: '0.75rem' }}>
            <button
              type="button"
              className="filter-chip-btn"
              onClick={() => setViewMode('families')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ArrowLeft size={16} /> Back to Families List
            </button>
            <button
              type="button"
              className="btn-festive-primary"
              onClick={() => window.print()}
              style={{ background: '#b45309', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem' }}
            >
              <Printer size={18} /> Print Pujari Gothram Sheet
            </button>
          </div>

          <div style={{ textAlign: 'center', borderBottom: '2px solid #b45309', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, color: '#7c2d12', fontSize: '1.8rem', fontWeight: 800 }}>
              🕉️ BPS TWIN TOWERS - GANESH UTSAV 2026
            </h2>
            <h3 style={{ margin: '0.3rem 0', color: '#b45309', fontSize: '1.2rem' }}>
              Pujari Archana & Gothram Registry
            </h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
              Official resident names and Gothrams for Vedic Mantrocharana and Archana
            </p>
          </div>

          <div className="mobile-table-hint no-print">
            <span>👈 Swipe table horizontally to view full registry details 👉</span>
          </div>

          <div className="ganesh-table-container">
            <table className="ganesh-table">
              <thead>
                <tr style={{ background: '#fef3c7' }}>
                  <th style={{ width: '60px' }}>Sl No</th>
                  <th style={{ width: '90px' }}>Flat</th>
                  <th style={{ width: '180px' }}>Gothram</th>
                  <th style={{ width: '180px' }}>Family Head / Resident</th>
                  <th>Family Members</th>
                </tr>
              </thead>
              <tbody>
                {filteredSankalpams.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, textAlign: 'center' }}>{idx + 1}</td>
                    <td>
                      <strong>{item.flatNo}</strong>
                    </td>
                    <td style={{ fontWeight: 800, color: '#9a3412' }}>{item.gothram}</td>
                    <td>
                      <strong>{item.primaryResidentName}</strong>
                    </td>
                    <td>
                      <ol style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.4' }}>
                        {item.familyMembers.map((m) => (
                          <li key={m.id}>
                            <strong>{m.name}</strong> {m.relationship ? `(${m.relationship})` : ''}{' '}
                            {m.nakshatram ? ` - ${m.nakshatram}` : ''}
                          </li>
                        ))}
                      </ol>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: CONTRIBUTION & SPONSOR PRINT SHEET */}
      {viewMode === 'contributions' && (
        <div className="sankalpam-printable-sheet" style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px' }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #a7f3d0', paddingBottom: '0.75rem' }}>
            <button
              type="button"
              className="filter-chip-btn"
              onClick={() => setViewMode('families')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ArrowLeft size={16} /> Back to Families List
            </button>
            <button
              type="button"
              className="btn-festive-primary"
              onClick={() => window.print()}
              style={{ background: '#047857', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem' }}
            >
              <Printer size={18} /> Print Contribution & Sponsor Sheet
            </button>
          </div>

          <div style={{ textAlign: 'center', borderBottom: '2px solid #047857', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, color: '#065f46', fontSize: '1.8rem', fontWeight: 800 }}>
              🕉️ BPS TWIN TOWERS - GANESH UTSAV 2026
            </h2>
            <h3 style={{ margin: '0.3rem 0', color: '#047857', fontSize: '1.2rem' }}>
              Official Contributions & Sponsors Collection Registry
            </h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
              Voluntary contributions & special pooja sponsorships by community residents
            </p>
          </div>

          {/* Metric Badges for Print / Screen */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '10px', flex: 1, minWidth: '160px' }}>
              <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Total Collections</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#065f46' }}>₹{totalContributions.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem 1rem', borderRadius: '10px', flex: 1, minWidth: '160px' }}>
              <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase' }}>Tower A Collection</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e40af' }}>₹{towerATotal.toLocaleString('en-IN')} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>({towerAContributions.length} entries)</span></div>
            </div>
            <div style={{ background: '#fdf4ff', border: '1px solid #f5d0fe', padding: '0.75rem 1rem', borderRadius: '10px', flex: 1, minWidth: '160px' }}>
              <div style={{ fontSize: '0.75rem', color: '#a21caf', fontWeight: 700, textTransform: 'uppercase' }}>Tower B Collection</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#86198f' }}>₹{towerBTotal.toLocaleString('en-IN')} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>({towerBContributions.length} entries)</span></div>
            </div>
          </div>

          <div className="mobile-table-hint no-print">
            <span>👈 Swipe table horizontally to view all columns 👉</span>
          </div>

          <div className="ganesh-table-container">
            <table className="ganesh-table">
              <thead>
                <tr style={{ background: '#ecfdf5' }}>
                  <th style={{ width: '50px' }}>Sl</th>
                  <th style={{ width: '80px' }}>Flat</th>
                  <th>Contributor / Sponsor Name</th>
                  <th>Type / Category</th>
                  <th style={{ width: '90px' }}>Mode</th>
                  <th style={{ width: '120px' }}>Ref / UTR</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Amount</th>
                  <th style={{ width: '100px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c, idx) => (
                  <tr key={c.id}>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                    <td><strong>{c.flatNo}</strong></td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.donorName}</div>
                      {c.isSponsor && c.sponsorCategory && (
                        <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>
                          ⭐ {c.sponsorCategory}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`chip-badge ${c.isSponsor ? 'badge-sponsor' : 'badge-general'}`}>
                        {c.isSponsor ? 'Sponsorship' : c.contributionType}
                      </span>
                    </td>
                    <td>{c.paymentMode}</td>
                    <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{c.transactionRef || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#047857' }}>
                      ₹{c.amount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{c.createdAt ? c.createdAt.split('T')[0] : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#ecfdf5', fontWeight: 800 }}>
                  <td colSpan={6} style={{ textAlign: 'right' }}>Total Collections:</td>
                  <td style={{ textAlign: 'right', color: '#047857', fontSize: '1.05rem' }}>
                    ₹{totalContributions.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: EXPENSES PRINT SHEET */}
      {viewMode === 'expenses' && (
        <div className="sankalpam-printable-sheet" style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px' }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #fecdd3', paddingBottom: '0.75rem' }}>
            <button
              type="button"
              className="filter-chip-btn"
              onClick={() => setViewMode('families')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ArrowLeft size={16} /> Back to Families List
            </button>
            <button
              type="button"
              className="btn-festive-primary"
              onClick={() => window.print()}
              style={{ background: '#be123c', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem' }}
            >
              <Printer size={18} /> Print Expense Sheet
            </button>
          </div>

          <div style={{ textAlign: 'center', borderBottom: '2px solid #be123c', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, color: '#881337', fontSize: '1.8rem', fontWeight: 800 }}>
              🕉️ BPS TWIN TOWERS - GANESH UTSAV 2026
            </h2>
            <h3 style={{ margin: '0.3rem 0', color: '#be123c', fontSize: '1.2rem' }}>
              Official Festival Expenses & Vendor Payouts Ledger
            </h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
              Audited statement of puja samagri, decoration, food prasadam, and event payouts
            </p>
          </div>

          {/* Metric Badges for Expense Sheet */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '0.75rem 1rem', borderRadius: '10px', flex: 1, minWidth: '160px' }}>
              <div style={{ fontSize: '0.75rem', color: '#be123c', fontWeight: 700, textTransform: 'uppercase' }}>Total Expenses Spent</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#9f1239' }}>₹{totalExpenses.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '10px', flex: 1, minWidth: '160px' }}>
              <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, textTransform: 'uppercase' }}>Total Collections</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#065f46' }}>₹{totalContributions.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '10px', flex: 1, minWidth: '160px' }}>
              <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Net Balance</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: (totalContributions - totalExpenses) >= 0 ? '#047857' : '#be123c' }}>
                ₹{(totalContributions - totalExpenses).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="mobile-table-hint no-print">
            <span>👈 Swipe table horizontally to view all columns 👉</span>
          </div>

          <div className="ganesh-table-container">
            <table className="ganesh-table">
              <thead>
                <tr style={{ background: '#fff1f2' }}>
                  <th style={{ width: '50px' }}>Sl</th>
                  <th style={{ width: '95px' }}>Date</th>
                  <th>Expense Description</th>
                  <th style={{ width: '160px' }}>Category</th>
                  <th>Paid To / Vendor</th>
                  <th style={{ width: '85px' }}>Mode</th>
                  <th style={{ width: '100px' }}>Invoice / Bill</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, idx) => (
                  <tr key={e.id}>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{e.expenseDate}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{e.title}</div>
                      {e.notes && <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{e.notes}</div>}
                    </td>
                    <td>
                      <span className="category-tag">{e.category}</span>
                    </td>
                    <td><strong>{e.paidTo}</strong></td>
                    <td>{e.paymentMode}</td>
                    <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{e.invoiceNo || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#be123c' }}>
                      ₹{e.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#fff1f2', fontWeight: 800 }}>
                  <td colSpan={7} style={{ textAlign: 'right' }}>Total Expenses:</td>
                  <td style={{ textAlign: 'right', color: '#be123c', fontSize: '1.05rem' }}>
                    ₹{totalExpenses.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
