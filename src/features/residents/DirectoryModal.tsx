import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Users, Building, Phone, Mail } from 'lucide-react';
import { supabase } from '../../services/supabase/client';

interface DirectoryMember {
  id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  flat_number: string;
  block_name: string;
  membership_type: string;
  resident_type: string | null;
  relationship: string;
}

interface DirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectoryModal: React.FC<DirectoryModalProps> = ({ isOpen, onClose }) => {
  const [directory, setDirectory] = useState<DirectoryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [blockFilter, setBlockFilter] = useState<'ALL' | 'A' | 'B'>('ALL');

  useEffect(() => {
    if (isOpen) {
      const fetchDirectory = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('flat_members')
            .select(`
              id,
              full_name,
              email,
              mobile,
              membership_type,
              resident_type,
              relationship,
              flats!flat_members_flat_id_fkey (
                flat_number,
                blocks!flats_block_id_fkey ( name )
              ),
              profiles!flat_members_user_id_fkey (
                full_name,
                email,
                mobile
              )
            `)
            .eq('status', 'Active');

          if (error) throw error;

          const rows = (data || []).map((r: any) => ({
            id: r.id,
            full_name: r.full_name || r.profiles?.full_name || 'Resident',
            email: r.email || r.profiles?.email || null,
            mobile: r.mobile || r.profiles?.mobile || null,
            flat_number: r.flats?.flat_number || '',
            block_name: r.flats?.blocks?.name || '',
            membership_type: r.membership_type,
            resident_type: r.resident_type,
            relationship: r.relationship,
          }));

          setDirectory(rows);
        } catch (err) {
          console.error('Error fetching directory:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchDirectory();
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    return directory.filter((d) => {
      const matchesBlock = blockFilter === 'ALL' || d.block_name === blockFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.flat_number.toLowerCase().includes(q) ||
        (d.full_name && d.full_name.toLowerCase().includes(q)) ||
        (d.mobile && d.mobile.includes(q));
      return matchesBlock && matchesSearch;
    });
  }, [directory, search, blockFilter]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Community Directory</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              BPS Twin Towers Society Members
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="admin-search-input"
              style={{ width: '100%', paddingLeft: '2.4rem' }}
              placeholder="Search by resident name or flat number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {(['ALL', 'A', 'B'] as const).map((b) => (
              <button
                key={b}
                className="btn-outline"
                onClick={() => setBlockFilter(b)}
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8rem',
                  background: blockFilter === b ? 'rgba(59, 130, 246, 0.2)' : undefined,
                  borderColor: blockFilter === b ? 'var(--accent-primary)' : undefined,
                }}
              >
                {b === 'ALL' ? 'All' : `Block ${b}`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading directory...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No residents found matching your search.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filtered.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{d.full_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Flat <strong>{d.flat_number}</strong> (Block {d.block_name}) · {d.relationship}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {d.mobile && (
                      <a
                        href={`tel:${d.mobile}`}
                        className="btn-outline"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', gap: '0.25rem' }}
                        title="Call Resident"
                      >
                        <Phone size={12} />
                        {d.mobile}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
