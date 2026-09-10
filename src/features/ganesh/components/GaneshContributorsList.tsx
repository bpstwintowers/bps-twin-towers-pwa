import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Sparkles,
  FileSpreadsheet,
  Play,
  Pause,
  HeartHandshake,
  QrCode,
  X,
} from 'lucide-react';
import type { GaneshContributionRecord } from '../../../types/ganesh';
import { exportGaneshCollectionsCSV } from '../../../services/ganeshService';

interface Props {
  contributions: GaneshContributionRecord[];
  onOpenContributeModal: () => void;
  onOpenSponsorModal: () => void;
  userFlat?: string;
}

export const GaneshContributorsList: React.FC<Props> = ({
  contributions,
  onOpenContributeModal,
  onOpenSponsorModal,
  userFlat: _userFlat = '',
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'TOWER_A' | 'TOWER_B' | 'SPONSORS' | 'MAJOR'>('ALL');
  const [sortBy, setSortBy] = useState<'amountDesc' | 'flat' | 'name'>('amountDesc');
  const viewFormat: 'cards' | 'table' = 'cards';

  // Auto-Scroll State for Resident Contributions Feed
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isAutoScrollPaused || isHovered) return;

    const scrollInterval = setInterval(() => {
      if (el) {
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          // Loop smoothly back to top when reaching bottom
          el.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          el.scrollTop += 1.2;
        }
      }
    }, 40);

    return () => clearInterval(scrollInterval);
  }, [isAutoScrollPaused, isHovered]);

  // Auto-Scroll State for Sponsors Feed (when multiple sponsors)
  const sponsorsScrollRef = useRef<HTMLDivElement>(null);
  const [isSponsorsHovered, setIsSponsorsHovered] = useState(false);

  useEffect(() => {
    const el = sponsorsScrollRef.current;
    if (!el || isSponsorsHovered) return;

    const scrollInterval = setInterval(() => {
      if (el) {
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          el.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          el.scrollTop += 1.0;
        }
      }
    }, 45);

    return () => clearInterval(scrollInterval);
  }, [isSponsorsHovered]);

  const filteredAndSorted = useMemo(() => {
    let list = [...contributions];

    if (filterType === 'TOWER_A') {
      list = list.filter((c) => c.tower === 'A');
    } else if (filterType === 'TOWER_B') {
      list = list.filter((c) => c.tower === 'B');
    } else if (filterType === 'SPONSORS') {
      list = list.filter((c) => c.isSponsor);
    } else if (filterType === 'MAJOR') {
      list = list.filter((c) => c.amount >= 5000);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.donorName && c.donorName.toLowerCase().includes(q)) ||
          (c.flatNo && c.flatNo.toLowerCase().includes(q)) ||
          (c.sponsorCategory && c.sponsorCategory.toLowerCase().includes(q)) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'amountDesc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'flat') {
        return (a.flatNo || '').localeCompare(b.flatNo || '');
      }
      if (sortBy === 'name') {
        return (a.donorName || '').localeCompare(b.donorName || '');
      }
      return (a.slNo || 0) - (b.slNo || 0);
    });

    return list;
  }, [contributions, filterType, search, sortBy]);

  // Separate Sponsors vs Resident Contributions
  const sponsorsList = useMemo(() => {
    return filteredAndSorted.filter((c) => c.isSponsor);
  }, [filteredAndSorted]);

  const residentContributionsList = useMemo(() => {
    return filteredAndSorted.filter((c) => !c.isSponsor);
  }, [filteredAndSorted]);

  const totalFilteredAmount = filteredAndSorted.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalSponsorAmount = sponsorsList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalResidentAmount = residentContributionsList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleExportCSV = () => {
    const csv = exportGaneshCollectionsCSV(contributions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ganesh_Utsav_Contributions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderCard = (item: GaneshContributionRecord, _idx?: number) => (
    <div
      key={item.id}
      className={`ganesh-mobile-card ${item.isSponsor ? 'is-sponsor' : ''}`}
    >
      <div className="ganesh-mobile-card-top">
        <div className="ganesh-mobile-card-name-block">
          <span
            className={`flat-badge ${
              item.tower === 'A'
                ? 'flat-badge-a'
                : item.tower === 'B'
                ? 'flat-badge-b'
                : 'flat-badge-other'
            }`}
          >
            {item.flatNo || 'External'}
          </span>
          <span className="ganesh-mobile-card-name">{item.donorName}</span>
          {item.amount >= 5000 && <span title="Major Patron">⭐</span>}
        </div>

        <div className={`ganesh-mobile-card-amount ${item.isSponsor ? 'is-sponsor-amt' : ''}`}>
          ₹{item.amount.toLocaleString('en-IN')}
        </div>
      </div>

      <div className="ganesh-mobile-card-middle">
        {item.isSponsor ? (
          <span className="sponsor-tag">
            <Sparkles size={12} />
            {item.sponsorCategory || item.contributionType || 'Sponsor'}
          </span>
        ) : (
          <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
            {item.contributionType || 'General Contribution'}
          </span>
        )}

        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
            background: item.paymentMode === 'Cash' ? '#fef3c7' : '#e0e7ff',
            color: item.paymentMode === 'Cash' ? '#92400e' : '#3730a3',
          }}
        >
          {item.paymentMode || 'UPI'}
        </span>
      </div>

      {item.notes && (
        <div className="ganesh-mobile-card-notes">
          {item.notes}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Toolbar & Filters */}
      <div className="ganesh-toolbar">
        <div className="ganesh-search-wrap">
          <Search className="ganesh-search-icon" size={14} />
          <input
            type="text"
            className="ganesh-search-input"
            placeholder="Search by Flat (B901, A1010) or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="ganesh-search-clear-btn"
              onClick={() => setSearch('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="ganesh-filter-group">
          <div className="ganesh-filter-chips">
            <button
              type="button"
              className={`filter-chip-btn ${filterType === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              All ({contributions.length})
            </button>
            <button
              type="button"
              className={`filter-chip-btn ${filterType === 'TOWER_A' ? 'active' : ''}`}
              onClick={() => setFilterType('TOWER_A')}
            >
              Tower A
            </button>
            <button
              type="button"
              className={`filter-chip-btn ${filterType === 'TOWER_B' ? 'active' : ''}`}
              onClick={() => setFilterType('TOWER_B')}
            >
              Tower B
            </button>
          </div>

          <div className="ganesh-filter-actions">
            <select
              className="ganesh-form-select ganesh-sort-select"
              style={{
                padding: '0.1rem 0.25rem',
                fontSize: '0.72rem',
                height: '25px',
                width: 'auto',
                maxWidth: '120px',
                borderRadius: '5px',
                border: '1px solid var(--border-color, #cbd5e1)',
              }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="amountDesc">Amount (High)</option>
              <option value="flat">Flat No</option>
              <option value="name">Name (A-Z)</option>
            </select>

            <button
              type="button"
              className="filter-chip-btn"
              onClick={handleExportCSV}
              title="Download Excel/CSV Spreadsheet"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                width: '25px',
                height: '25px',
                minWidth: '25px',
                flexShrink: 0,
                borderRadius: '5px',
                background: 'var(--surface-secondary, #f8fafc)',
                border: '1px solid var(--border-color, #cbd5e1)',
                color: '#475569',
              }}
            >
              <FileSpreadsheet size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.4rem 0.2rem 0.85rem 0.2rem',
          fontSize: '0.82rem',
          color: '#475569',
          flexWrap: 'wrap',
          gap: '0.4rem',
        }}
      >
        <span>
          Showing <strong>{filteredAndSorted.length}</strong> matching records
        </span>
        <span>
          Filtered Total: <strong style={{ color: '#0f172a' }}>₹{totalFilteredAmount.toLocaleString('en-IN')}</strong>
        </span>
      </div>

      {/* VIEW 1: CARDS VIEW (SIDE-BY-SIDE SPONSORS & AUTO-SCROLLING CONTRIBUTIONS) */}
      {viewFormat === 'cards' ? (
        filterType === 'ALL' && !search.trim() ? (
          /* Side by Side Grid Layout */
          <div className="ganesh-side-by-side-grid animate-fade-in">
            {/* COLUMN 1: FESTIVE SPONSORS & SEVA PATRONS */}
            <div className="ganesh-column-card sponsors-column">
              <div className="ganesh-column-header">
                <div>
                  <h3 className="ganesh-column-title">
                    <span>🌟</span> Special Sponsors & Seva Patrons
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '0.15rem' }}>
                    Total Sponsored: <strong>₹{totalSponsorAmount.toLocaleString('en-IN')}</strong> ({sponsorsList.length} Sponsors)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
                  <button
                    type="button"
                    onClick={onOpenSponsorModal}
                    style={{
                      background: '#fff7ed',
                      border: '1px solid #fdba74',
                      color: '#c2410c',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Sparkles size={12} /> + Sponsor
                  </button>
                </div>
              </div>

              {/* Auto Scrolling Container for Sponsors */}
              <div
                ref={sponsorsScrollRef}
                className="ganesh-autoscroll-container"
                onMouseEnter={() => setIsSponsorsHovered(true)}
                onMouseLeave={() => setIsSponsorsHovered(false)}
                onTouchStart={() => setIsSponsorsHovered(true)}
                onTouchEnd={() => setIsSponsorsHovered(false)}
                title="Hover or touch to pause scroll"
              >
                {sponsorsList.length > 0 ? (
                  sponsorsList.map((item, idx) => renderCard(item, idx))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                    No sponsors recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: RESIDENT VOLUNTARY CONTRIBUTIONS (LIVE AUTO-SCROLLING) */}
            <div className="ganesh-column-card">
              <div className="ganesh-column-header">
                <div>
                  <h3 className="ganesh-column-title">
                    <span>🙏</span> Resident Voluntary Contributions
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '0.15rem' }}>
                    Total Contributed: <strong>₹{totalResidentAmount.toLocaleString('en-IN')}</strong> ({residentContributionsList.length} Flats)
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
                  {residentContributionsList.length > 2 && (
                    <>
                      <span className="ganesh-column-badge badge-live-scroll">
                        🔴 {isAutoScrollPaused ? 'Paused' : 'Live Auto-Scroll'}
                      </span>

                      <button
                        type="button"
                        className="ganesh-scroll-control-btn"
                        onClick={() => setIsAutoScrollPaused((p) => !p)}
                        title={isAutoScrollPaused ? 'Resume Auto-Scrolling' : 'Pause Auto-Scrolling'}
                      >
                        {isAutoScrollPaused ? <Play size={12} /> : <Pause size={12} />}
                        <span>{isAutoScrollPaused ? 'Play' : 'Pause'}</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={onOpenContributeModal}
                    style={{
                      background: '#ea580c',
                      border: 'none',
                      color: '#ffffff',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <QrCode size={12} /> + Contribute
                  </button>
                </div>
              </div>

              {/* Auto Scrolling Container with Pause on Hover/Touch */}
              <div
                ref={scrollRef}
                className="ganesh-autoscroll-container"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={() => setIsHovered(true)}
                onTouchEnd={() => setIsHovered(false)}
                title="Hover or touch to pause scroll"
              >
                {residentContributionsList.length > 0 ? (
                  residentContributionsList.map((item, idx) => renderCard(item, idx))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
                    No resident contributions recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Filtered or Searched Single Stream Cards View */
          <div className="ganesh-mobile-cards-list">
            {filteredAndSorted.map((item, idx) => renderCard(item, idx))}
          </div>
        )
      ) : (
        /* VIEW 2: FULL HORIZONTAL-SCROLL TABLE */
        <div>
          <div className="mobile-table-hint">
            <span>👈 Swipe table horizontally to see all columns 👉</span>
          </div>
          <div className="ganesh-table-container">
            <table className="ganesh-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>SI No</th>
                <th>Resident / Donor Name</th>
                <th style={{ width: '100px' }}>Flat No</th>
                <th>Category & Sponsorship Details</th>
                <th style={{ width: '85px' }}>Mode</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((item, idx) => (
                <tr key={item.id} className={item.isSponsor ? 'sponsor-row' : ''}>
                  <td style={{ fontWeight: 600, color: '#64748b' }}>{item.slNo || idx + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <strong>{item.donorName}</strong>
                      {item.amount >= 5000 && (
                        <span title="Major Patron" style={{ color: '#eab308' }}>
                          ⭐
                        </span>
                      )}
                    </div>
                    {item.notes && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                        {item.notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className={`flat-badge ${
                        item.tower === 'A'
                          ? 'flat-badge-a'
                          : item.tower === 'B'
                          ? 'flat-badge-b'
                          : 'flat-badge-other'
                      }`}
                    >
                      {item.flatNo || 'External'}
                    </span>
                  </td>
                  <td>
                    {item.isSponsor ? (
                      <span className="sponsor-tag">
                        <Sparkles size={12} />
                        {item.sponsorCategory || item.contributionType || 'Sponsor'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                        {item.contributionType || 'General Contribution'}
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.45rem',
                        borderRadius: '4px',
                        background: item.paymentMode === 'Cash' ? '#fef3c7' : '#e0e7ff',
                        color: item.paymentMode === 'Cash' ? '#92400e' : '#3730a3',
                      }}
                    >
                      {item.paymentMode || 'UPI'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`amount-display ${item.isSponsor ? 'sponsor-amount' : ''}`}>
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);
};
