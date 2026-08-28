import React, { useState, useEffect } from 'react';
import { X, Users, Phone, Mail, CheckCircle2, Search } from 'lucide-react';
import {
  fetchEventParticipants,
  type EventItem,
  type EventRegistrationItem,
} from '../../services/supabase/eventService';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface EventParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
}

export const EventParticipantsModal: React.FC<EventParticipantsModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [participants, setParticipants] = useState<EventRegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && event) {
      const load = async () => {
        try {
          setLoading(true);
          const data = await fetchEventParticipants(event.id);
          setParticipants(data);
        } catch (err) {
          console.error('Error fetching participants:', err);
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const totalHeadcount = participants.reduce((sum, p) => sum + (p.quantity || 1), 0);

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      p.participant_name.toLowerCase().includes(q) ||
      (p.flat_number && p.flat_number.toLowerCase().includes(q)) ||
      (p.participant_mobile && p.participant_mobile.includes(q))
    );
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Registered Participants</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {event.title} · Total Headcount: <strong>{totalHeadcount}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            className="admin-search-input"
            style={{ width: '100%' }}
            placeholder="Search participant name, flat number, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading participants...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No participants registered yet.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Flat</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Registered At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.participant_name}</div>
                      {p.participant_mobile && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {p.participant_mobile}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{p.flat_number || 'N/A'}</strong>
                      {p.block_name && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {' '}(Block {p.block_name})
                        </span>
                      )}
                    </td>
                    <td>{p.participant_type}</td>
                    <td><strong>{p.quantity}</strong></td>
                    <td style={{ fontSize: '0.78rem' }}>
                      {new Date(p.registered_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
