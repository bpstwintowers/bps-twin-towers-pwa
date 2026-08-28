import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import {
  resolveUserAccess,
  type AccessInfo,
} from '../../services/supabase/registrationService';
import { checkIsAdmin, fetchUserRoles } from '../../services/supabase/adminService';
import { HouseholdModal } from '../../features/residents/HouseholdModal';
import { DirectoryModal } from '../../features/residents/DirectoryModal';
import { NotificationBell } from '../../features/notifications/NotificationBell';
import {
  LogOut,
  Home,
  Users,
  Shield,
  Bell,
  Sparkles,
  Calendar,
  CreditCard,
  Award,
  ChevronDown,
  Check,
  Plus,
  Building2,
  Menu,
  X,
  User,
} from 'lucide-react';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState<any>(null);
  const [access, setAccess] = useState<AccessInfo[]>([]);
  const [activeFlatIndex, setActiveFlatIndex] = useState(0);
  const [isFlatSwitcherOpen, setIsFlatSwitcherOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDrawerFlatDropdownOpen, setIsDrawerFlatDropdownOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [activeRole, setActiveRole] = useState<string>('Resident');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isDesktopRoleOpen, setIsDesktopRoleOpen] = useState(false);

  const flatSwitcherRef = useRef<HTMLDivElement>(null);
  const desktopRoleSwitcherRef = useRef<HTMLDivElement>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  // Modals
  const [selectedFlatForHousehold, setSelectedFlatForHousehold] = useState<AccessInfo | null>(null);
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileData) setProfile(profileData);

        // Resolve access
        try {
          const accessData = await resolveUserAccess();
          setAccess(accessData);
          const savedFlatId = localStorage.getItem('bps_active_flat_id');
          if (savedFlatId && accessData.length > 0) {
            const foundIdx = accessData.findIndex((a) => a.flat_id === savedFlatId);
            if (foundIdx >= 0) setActiveFlatIndex(foundIdx);
          }
        } catch (err) {
          console.error('Error resolving access in layout:', err);
        }

        // Check roles & admin
        try {
          const [adminStatus, roles] = await Promise.all([
            checkIsAdmin(),
            fetchUserRoles(),
          ]);
          setIsAdmin(adminStatus);
          setUserRoles(roles);
          if (roles.includes('Admin')) {
            setActiveRole('Admin');
          } else if (roles.length > 0) {
            setActiveRole(roles[0]);
          }
        } catch (err) {
          console.error('Error checking roles in layout:', err);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserData();
  }, []);

  // Close switchers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (flatSwitcherRef.current && !flatSwitcherRef.current.contains(e.target as Node)) {
        setIsFlatSwitcherOpen(false);
      }
      if (desktopRoleSwitcherRef.current && !desktopRoleSwitcherRef.current.contains(e.target as Node)) {
        setIsDesktopRoleOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleOpenHousehold = (flatAccess: AccessInfo) => {
    setSelectedFlatForHousehold(flatAccess);
    setIsHouseholdModalOpen(true);
  };

  const getRoleDisplay = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('admin') && !r.includes('event') && !r.includes('facility') && !r.includes('helpdesk')) {
      return { label: 'Society Admin', color: 'admin', icon: <Shield size={12} /> };
    }
    if (r.includes('event') || r.includes('festival') || r.includes('culture')) {
      return { label: 'Event Admin', color: 'event', icon: <Sparkles size={12} /> };
    }
    if (r.includes('finance')) {
      return { label: 'Finance Manager', color: 'finance', icon: <Award size={12} /> };
    }
    if (r.includes('facility') || r.includes('helpdesk')) {
      return { label: 'Facility Admin', color: 'facility', icon: <Building2 size={12} /> };
    }
    if (r.includes('security') || r.includes('gate')) {
      return { label: 'Security Guard', color: 'security', icon: <Shield size={12} /> };
    }
    return { label: 'Resident / Owner', color: 'resident', icon: <Home size={12} /> };
  };

  const hasActiveMembership = access.length > 0;
  const activeFlat = access[activeFlatIndex] || access[0];

  // Dynamic Header Title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/events')) return 'Events & Festivals';
    if (path.startsWith('/donations')) return 'My Contributions';
    if (path.startsWith('/notifications')) return 'Notifications';
    if (path.startsWith('/facilities') || path.startsWith('/my-bookings')) return 'Amenities & Bookings';
    if (path.startsWith('/complaints')) return 'Maintenance & Complaints';
    if (path.startsWith('/my-visitors')) return 'Visitor Passes & Gate';
    if (path.startsWith('/volunteers')) return 'Volunteer Opportunities';
    if (path.startsWith('/sponsors')) return 'Society Sponsorships';
    if (path.startsWith('/announcements')) return 'Announcements';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/security') || path.startsWith('/gate')) return 'Security Console';
    return 'Community Portal';
  };

  const isNavActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="dashboard-app-layout">
      {/* =========================================================================
          1. DESKTOP PERMANENT LEFT SIDEBAR
         ========================================================================= */}
      <aside className="dashboard-desktop-sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="BPS" className="sidebar-brand-logo" />
          <div className="sidebar-brand-title">BPS Twin Towers</div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav-list">
          <button
            type="button"
            className={`sidebar-nav-item ${isNavActive('/') ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <Home size={18} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${isNavActive('/events') ? 'active' : ''}`}
            onClick={() => navigate('/events')}
          >
            <Calendar size={18} />
            <span>Events</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${isNavActive('/donations') ? 'active' : ''}`}
            onClick={() => navigate('/donations')}
          >
            <CreditCard size={18} />
            <span>My Contributions</span>
          </button>

          <button
            type="button"
            className={`sidebar-nav-item ${isNavActive('/notifications') ? 'active' : ''}`}
            onClick={() => navigate('/notifications')}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            className="sidebar-nav-item"
            onClick={() => {
              if (activeFlat) {
                handleOpenHousehold(activeFlat);
              } else {
                setIsDirectoryModalOpen(true);
              }
            }}
          >
            <User size={18} />
            <span>Profile</span>
          </button>
        </nav>

        {/* Sidebar Footer User Widget */}
        <div className="sidebar-user-widget">
          <div className="sidebar-user-avatar">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'R'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{profile?.full_name || 'Resident'}</div>
            <div className="sidebar-user-flat">
              {activeFlat ? `Tower ${activeFlat.flat_number?.toUpperCase().startsWith('B') ? 'B' : 'A'}, ${activeFlat.flat_number}` : 'Resident'}
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. MAIN CONTENT AREA & TOP HEADER
         ========================================================================= */}
      <div className="dashboard-main-area">
        {/* Top Header Bar */}
        <header className="dashboard-top-header">
          <div className="header-left-title-group">
            <button
              type="button"
              className="btn-mobile-menu-toggle mobile-only-action"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="header-page-title">{getPageTitle()}</h1>
          </div>

          <div className="header-actions-group">
            {/* Multi-Flat Switcher (Desktop) */}
            <div className="desktop-only-action">
              {access.length > 1 ? (
                <div className="active-flat-switcher-dropdown" ref={flatSwitcherRef}>
                  <button
                    type="button"
                    className="btn-flat-switcher"
                    onClick={() => setIsFlatSwitcherOpen(!isFlatSwitcherOpen)}
                    title="Switch flat"
                  >
                    <Building2 size={15} className="flat-switcher-icon" />
                    <span className="flat-switcher-current-label">Flat {activeFlat?.flat_number}</span>
                    <ChevronDown size={14} className={`flat-switcher-arrow ${isFlatSwitcherOpen ? 'open' : ''}`} />
                  </button>

                  {isFlatSwitcherOpen && (
                    <div className="flat-switcher-menu animate-fade-in">
                      <div className="switcher-menu-header">
                        <span>Your Registered Flats ({access.length})</span>
                      </div>

                      <div className="switcher-items-list">
                        {access.map((flat, idx) => (
                          <button
                            key={flat.flat_id}
                            type="button"
                            className={`flat-switcher-item ${idx === activeFlatIndex ? 'selected' : ''}`}
                            onClick={() => {
                              setActiveFlatIndex(idx);
                              localStorage.setItem('bps_active_flat_id', flat.flat_id);
                              setIsFlatSwitcherOpen(false);
                            }}
                          >
                            <div className="switcher-item-left">
                              <div className="switcher-icon-circle">
                                <Home size={14} />
                              </div>
                              <div className="switcher-item-text">
                                <span className="switcher-flat-num">Flat {flat.flat_number || 'Unit'}</span>
                                <span className="switcher-flat-sub">
                                  {(flat.flat_number || '').toUpperCase().startsWith('B') ? 'Tower B' : 'Tower A'} • {flat.role_name || 'Resident'}
                                </span>
                              </div>
                            </div>
                            {idx === activeFlatIndex && <Check size={14} className="switcher-check" />}
                          </button>
                        ))}
                      </div>

                      <div className="switcher-divider" />
                      <button
                        type="button"
                        className="btn-switcher-add-flat"
                        onClick={() => {
                          setIsFlatSwitcherOpen(false);
                          navigate('/register');
                        }}
                      >
                        <Plus size={14} />
                        <span>+ Register Another Flat</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : hasActiveMembership && activeFlat ? (
                <div className="single-flat-badge-pill">
                  <Home size={13} />
                  <span>Flat {activeFlat.flat_number}</span>
                </div>
              ) : null}
            </div>

            {/* Multi-Role Switcher (Desktop) */}
            {userRoles.length > 1 ? (
              <div className="active-role-switcher-dropdown desktop-only-action" ref={desktopRoleSwitcherRef}>
                <button
                  type="button"
                  className={`btn-role-switcher ${getRoleDisplay(activeRole).color}`}
                  onClick={() => setIsDesktopRoleOpen(!isDesktopRoleOpen)}
                  title="Switch role"
                >
                  <span className="role-btn-inner">
                    {getRoleDisplay(activeRole).icon}
                    <span>{getRoleDisplay(activeRole).label}</span>
                  </span>
                  <ChevronDown size={13} className={`role-switcher-arrow ${isDesktopRoleOpen ? 'open' : ''}`} />
                </button>

                {isDesktopRoleOpen && (
                  <div className="role-switcher-menu animate-fade-in">
                    <div className="role-menu-header">Switch Role View</div>
                    <div className="role-items-list">
                      {userRoles.map((role) => {
                        const display = getRoleDisplay(role);
                        const isSelected = activeRole.toLowerCase() === role.toLowerCase();
                        return (
                          <button
                            key={role}
                            type="button"
                            className={`role-switcher-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setActiveRole(role);
                              setIsDesktopRoleOpen(false);
                              if (role.toLowerCase() === 'admin') {
                                navigate('/admin');
                              } else if (role.toLowerCase().includes('event')) {
                                navigate('/events');
                              }
                            }}
                          >
                            <div className="role-menu-item-left">
                              <span className={`role-item-dot ${display.color}`} />
                              <span className="role-item-name">{display.label}</span>
                            </div>
                            {isSelected && <Check size={14} className="role-check" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : isAdmin ? (
              <button
                onClick={() => navigate('/admin')}
                className="btn-primary desktop-only-action"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  gap: '0.4rem',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                }}
              >
                <Shield size={14} />
                Admin Portal
              </button>
            ) : null}

            {/* Notification Bell */}
            <NotificationBell />

            {/* Mobile Quick Flat Chip */}
            {hasActiveMembership && activeFlat && (
              <button
                type="button"
                className="mobile-active-flat-chip mobile-only-action"
                onClick={() => setIsMobileDrawerOpen(true)}
                title="View Menu"
              >
                <Building2 size={13} />
                <span>{activeFlat.flat_number}</span>
              </button>
            )}

            {/* Sign Out (Desktop) */}
            <button
              onClick={handleSignOut}
              className="btn-outline desktop-only-action"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', gap: '0.35rem' }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </header>

        {/* Mobile Left Navigation Drawer (Slide-out) */}
        {isMobileDrawerOpen && (
          <div className="mobile-drawer-overlay animate-fade-in" onClick={() => setIsMobileDrawerOpen(false)}>
            <div className="mobile-drawer-content animate-slide-left" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-drawer-header">
                <div className="drawer-brand">
                  <img src="/logo.png" alt="BPS" className="drawer-logo" />
                  <div>
                    <div className="drawer-brand-name">BPS Twin Towers</div>
                    <div className="drawer-brand-sub">Community Portal</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close-drawer"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Resident Profile Card with Multi-Role Dropdown */}
              <div className="drawer-profile-card">
                <div className="drawer-profile-top">
                  <div className="drawer-avatar">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'R'}
                  </div>
                  <div className="drawer-profile-info">
                    <div className="drawer-user-name">{profile?.full_name || 'Resident'}</div>
                    <div className="drawer-user-email">{profile?.email}</div>
                  </div>
                </div>

                <div className="drawer-role-switcher-container">
                  <button
                    type="button"
                    className={`drawer-role-badge-btn ${getRoleDisplay(activeRole).color}`}
                    onClick={() => userRoles.length > 1 && setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  >
                    <span className="role-btn-inner">
                      {getRoleDisplay(activeRole).icon}
                      <span>{getRoleDisplay(activeRole).label}</span>
                    </span>
                    {userRoles.length > 1 && (
                      <ChevronDown
                        size={12}
                        className={`drawer-role-chevron ${isRoleDropdownOpen ? 'open' : ''}`}
                      />
                    )}
                  </button>

                  {isRoleDropdownOpen && userRoles.length > 1 && (
                    <div className="drawer-role-dropdown-menu animate-fade-in">
                      <div className="drawer-role-menu-header">Switch Active Role:</div>
                      {userRoles.map((role) => {
                        const display = getRoleDisplay(role);
                        const isSelected = activeRole.toLowerCase() === role.toLowerCase();
                        return (
                          <button
                            key={role}
                            type="button"
                            className={`drawer-role-menu-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setActiveRole(role);
                              setIsRoleDropdownOpen(false);
                              if (role.toLowerCase() === 'admin') {
                                setIsMobileDrawerOpen(false);
                                navigate('/admin');
                              } else if (role.toLowerCase().includes('event')) {
                                setIsMobileDrawerOpen(false);
                                navigate('/events');
                              }
                            }}
                          >
                            <div className="role-menu-item-left">
                              <span className={`role-item-dot ${display.color}`} />
                              <span className="role-menu-item-label">{display.label}</span>
                            </div>
                            {isSelected && <Check size={13} className="drawer-role-check" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Flat Switcher Dropdown */}
              {access.length > 0 && (
                <div className="drawer-section">
                  <div className="drawer-section-title">
                    <span>Active Flat ({access.length} Total)</span>
                  </div>

                  <button
                    type="button"
                    className="drawer-flat-dropdown-trigger"
                    onClick={() => setIsDrawerFlatDropdownOpen(!isDrawerFlatDropdownOpen)}
                  >
                    <div className="drawer-flat-left">
                      <div className="drawer-flat-icon active">
                        <Home size={15} />
                      </div>
                      <div className="drawer-flat-meta">
                        <span className="drawer-flat-number">Flat {activeFlat?.flat_number || 'Unit'}</span>
                        <span className="drawer-flat-tower">
                          {(activeFlat?.flat_number || '').toUpperCase().startsWith('B') ? 'Tower B' : 'Tower A'} • {activeFlat?.role_name || 'Owner'}
                        </span>
                      </div>
                    </div>
                    {access.length > 1 && (
                      <ChevronDown
                        size={16}
                        className={`drawer-dropdown-chevron ${isDrawerFlatDropdownOpen ? 'open' : ''}`}
                      />
                    )}
                  </button>

                  {isDrawerFlatDropdownOpen && access.length > 1 && (
                    <div className="drawer-flat-dropdown-menu animate-fade-in">
                      <div className="drawer-menu-sublabel">Select Active Flat:</div>
                      {access.map((flat, idx) => (
                        <button
                          key={flat.flat_id}
                          type="button"
                          className={`drawer-flat-menu-item ${idx === activeFlatIndex ? 'selected' : ''}`}
                          onClick={() => {
                            setActiveFlatIndex(idx);
                            localStorage.setItem('bps_active_flat_id', flat.flat_id);
                            setIsDrawerFlatDropdownOpen(false);
                          }}
                        >
                          <div className="drawer-flat-left">
                            <div className="drawer-flat-icon">
                              <Building2 size={13} />
                            </div>
                            <div className="drawer-flat-meta">
                              <span className="drawer-flat-number">Flat {flat.flat_number || 'Unit'}</span>
                              <span className="drawer-flat-tower">
                                {(flat.flat_number || '').toUpperCase().startsWith('B') ? 'Tower B' : 'Tower A'}
                              </span>
                            </div>
                          </div>
                          {idx === activeFlatIndex && <Check size={14} className="drawer-flat-check" />}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="drawer-btn-add-flat"
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      navigate('/register');
                    }}
                  >
                    <Plus size={14} />
                    <span>Register Another Flat</span>
                  </button>
                </div>
              )}

              {/* Resident Navigation Menu */}
              <div className="drawer-section">
                <div className="drawer-section-title">Resident Menu</div>
                <div className="drawer-nav-list">
                  <button
                    type="button"
                    className={`drawer-nav-item ${isNavActive('/') ? 'active-nav' : ''}`}
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      navigate('/');
                    }}
                  >
                    <Home size={16} />
                    <span>Dashboard</span>
                  </button>

                  <button
                    type="button"
                    className={`drawer-nav-item ${isNavActive('/events') ? 'active-nav' : ''}`}
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      navigate('/events');
                    }}
                  >
                    <Calendar size={16} />
                    <span>Events</span>
                  </button>

                  <button
                    type="button"
                    className={`drawer-nav-item ${isNavActive('/donations') ? 'active-nav' : ''}`}
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      navigate('/donations');
                    }}
                  >
                    <CreditCard size={16} />
                    <span>My Contributions</span>
                  </button>

                  <button
                    type="button"
                    className={`drawer-nav-item ${isNavActive('/notifications') ? 'active-nav' : ''}`}
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      navigate('/notifications');
                    }}
                  >
                    <Bell size={16} />
                    <span>Notifications</span>
                  </button>

                  {activeFlat && (
                    <button
                      type="button"
                      className="drawer-nav-item"
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        handleOpenHousehold(activeFlat);
                      }}
                    >
                      <User size={16} />
                      <span>Profile</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      className="drawer-nav-item admin-highlight"
                      style={{ marginTop: '8px' }}
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        navigate('/admin');
                      }}
                    >
                      <Shield size={16} />
                      <span>Admin Portal Console</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="drawer-footer">
                <button
                  type="button"
                  className="btn-drawer-signout"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Nested Content */}
        <main className="dashboard-content-scrollable">
          <Outlet />
        </main>
      </div>

      {/* Household Modal */}
      {selectedFlatForHousehold && isHouseholdModalOpen && (
        <HouseholdModal
          isOpen={isHouseholdModalOpen}
          onClose={() => setIsHouseholdModalOpen(false)}
          flatId={selectedFlatForHousehold.flat_id}
          flatNumber={selectedFlatForHousehold.flat_number || ''}
          blockName={selectedFlatForHousehold.block_name || 'A'}
        />
      )}

      {/* Directory Modal */}
      {isDirectoryModalOpen && (
        <DirectoryModal
          isOpen={isDirectoryModalOpen}
          onClose={() => setIsDirectoryModalOpen(false)}
        />
      )}
    </div>
  );
};
