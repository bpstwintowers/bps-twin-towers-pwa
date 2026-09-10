import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '../../services/supabase/client';
import {
  resolveUserAccess,
  type AccessInfo,
} from '../../services/supabase/registrationService';
import { fetchUserRoles } from '../../services/supabase/adminService';
import { NAVIGATION_ITEMS, type NavItemConfig } from '../../config/navigation';
import { hasRequiredRole, isSuperAdmin, hasAnyAdminRole } from '../../utils/rbac';
import { HouseholdModal } from '../../features/residents/HouseholdModal';
import { DirectoryModal } from '../../features/residents/DirectoryModal';
import { EditProfileModal } from '../../features/residents/EditProfileModal';
import { MenuVisibilityModal } from './MenuVisibilityModal';
import {
  getMenuVisibility,
  fetchRemoteMenuVisibility,
  subscribeToMenuVisibility,
  type MenuVisibilityConfig,
} from '../../services/menuVisibilityService';
import { NotificationBell } from '../../features/notifications/NotificationBell';
import {
  LogOut,
  Home,
  Shield,
  Sparkles,
  Award,
  ChevronDown,
  Check,
  Plus,
  Building2,
  Menu,
  X,
  User,
  Search,
  Settings,
  Sliders,
} from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import './AppLayout.css';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchQuery, setSearchQuery, searchPlaceholder, clearSearch, isSearchVisible } = useSearch();

  const [profile, setProfile] = useState<any>(null);
  const [access, setAccess] = useState<AccessInfo[]>([]);
  const [activeFlatIndex, setActiveFlatIndex] = useState(0);
  const [isFlatSwitcherOpen, setIsFlatSwitcherOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isDrawerFlatDropdownOpen, setIsDrawerFlatDropdownOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [activeRole, setActiveRole] = useState<string>('Resident');

  const flatSwitcherRef = useRef<HTMLDivElement>(null);

  // Modals
  const [selectedFlatForHousehold, setSelectedFlatForHousehold] = useState<AccessInfo | null>(null);
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isMenuVisibilityModalOpen, setIsMenuVisibilityModalOpen] = useState(false);

  // Menu Visibility Configuration
  const [menuVisibility, setMenuVisibility] = useState<MenuVisibilityConfig>(getMenuVisibility());

  useEffect(() => {
    fetchRemoteMenuVisibility().then((remoteConfig) => {
      setMenuVisibility(remoteConfig);
    });

    const unsubscribe = subscribeToMenuVisibility((newConfig) => {
      setMenuVisibility(newConfig);
    });
    return unsubscribe;
  }, []);

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

        // Check roles
        try {
          const roles = await fetchUserRoles();
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

  const handleRoleSelect = (role: string) => {
    setActiveRole(role);
    const r = role.toLowerCase();
    if (r.includes('event')) {
      navigate('/events-manage');
    } else if (r.includes('finance')) {
      navigate('/finance-manage');
    } else if (r.includes('facility') || r.includes('helpdesk')) {
      navigate('/facilities-manage');
    } else if (r.includes('volunteer')) {
      navigate('/volunteers-manage');
    } else if (r.includes('sponsor')) {
      navigate('/sponsors-manage');
    } else if (r.includes('communication')) {
      navigate('/communications-manage');
    } else if (r.includes('security') || r.includes('gate')) {
      navigate('/security');
    } else if (r.includes('admin')) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const hasActiveMembership = access.length > 0;
  const activeFlat = access[activeFlatIndex] || access[0];

  const isSuperAdminUser = isSuperAdmin(userRoles, profile?.email);

  // Filter general navigation items by admin menu visibility configuration
  const generalNavItems = useMemo(() => {
    return NAVIGATION_ITEMS.filter((item) => {
      if (item.section !== 'general') return false;
      return menuVisibility[item.id as keyof MenuVisibilityConfig] !== false;
    });
  }, [menuVisibility]);

  const managementNavItems = useMemo(() => {
    return NAVIGATION_ITEMS.filter(
      (item) => item.section === 'management' && hasRequiredRole(userRoles, item.requiredRoles, profile?.email)
    );
  }, [userRoles, profile?.email]);

  // Dynamic Header Title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/permissions' || path.startsWith('/permissions')) return 'Roles & Permissions';
    if (path === '/events-manage' || path.startsWith('/admin/events')) return 'Event Management';
    if (path === '/facilities-manage' || path.startsWith('/admin/facilities')) return 'Facility Bookings Admin';
    if (path === '/complaints-manage' || path.startsWith('/admin/complaints')) return 'Complaints Console';
    if (path === '/finance-manage' || path.startsWith('/admin/finance')) return 'Donations & Finance Admin';
    if (path === '/volunteers-manage' || path.startsWith('/admin/volunteers')) return 'Volunteer Coordination';
    if (path === '/sponsors-manage' || path.startsWith('/admin/sponsors')) return 'Sponsors & Partners Admin';
    if (path === '/communications-manage' || path.startsWith('/admin/communications')) return 'Notice Board Admin';
    if (path === '/visitors-manage' || path.startsWith('/admin/visitors')) return 'Gate & Visitor Admin';
    if (path.startsWith('/events')) return 'Events & Festivals';
    if (path.startsWith('/ganesh')) return 'Ganesh Utsav 2026';
    if (path.startsWith('/facilities') || path.startsWith('/my-bookings')) return 'Amenities & Bookings';
    if (path.startsWith('/complaints')) return 'Maintenance & Complaints';
    if (path.startsWith('/my-visitors')) return 'Visitor Passes';
    if (path.startsWith('/donations')) return 'My Contributions';
    if (path.startsWith('/volunteers')) return 'Volunteer Opportunities';
    if (path.startsWith('/sponsors')) return 'Society Sponsorships';
    if (path.startsWith('/announcements')) return 'Announcements & Notices';
    if (path.startsWith('/notifications')) return 'Notification Center';
    if (path.startsWith('/profile')) return 'My Profile';
    if (path.startsWith('/settings')) return 'Settings & Preferences';
    if (path.startsWith('/security') || path.startsWith('/gate')) return 'Security Console';
    if (path.startsWith('/admin')) return 'Society Administration Console';
    return 'Community Portal';
  };

  const isNavActive = (path: string, exact?: boolean) => {
    if (path === '/' || exact) return location.pathname === path;
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
          <img src="/bps-logo.png" alt="BPS Twin Towers" className="sidebar-brand-logo" />
          <div className="sidebar-brand-title">BPS Twin Towers</div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav-list">
          {/* General Resident Section */}
          {generalNavItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.path, item.exact);
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Household / Flat Profile Item */}
          {menuVisibility.household && (
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
              <User size={17} />
              <span>My Household</span>
            </button>
          )}

          {/* Management / Admin Section (Visible only when user has management roles) */}
          {managementNavItems.length > 0 && (
            <>
              <div className="sidebar-section-divider" />
              <div className="sidebar-section-title">Administration</div>
              {managementNavItems.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item.path, item.exact);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar-nav-item management-item ${active ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Super Admin Menu Visibility Settings (Visible ONLY to Full Society Super Admin) */}
              {isSuperAdminUser && (
                <button
                  type="button"
                  className="sidebar-nav-item management-item"
                  onClick={() => setIsMenuVisibilityModalOpen(true)}
                  style={{ color: '#0d9488' }}
                  title="Configure which menus are visible to residents"
                >
                  <Sliders size={17} />
                  <span>Resident Menus</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* Sidebar Footer User Section with Edit Profile & Sign Out */}
        <div className="sidebar-user-footer-container">
          <div
            className="sidebar-user-widget"
            onClick={() => setIsEditProfileModalOpen(true)}
            title="Click to view & edit profile"
            role="button"
            tabIndex={0}
          >
            <div className="sidebar-user-avatar">
              {profile?.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'R'
              )}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {profile?.full_name || (isSuperAdmin(userRoles, profile?.email) ? 'Society Admin' : 'Resident')}
              </div>
              <div className="sidebar-user-flat">
                {activeFlat
                  ? `Tower ${activeFlat.flat_number?.toUpperCase().startsWith('B') ? 'B' : 'A'}, ${activeFlat.flat_number}`
                  : isSuperAdmin(userRoles, profile?.email)
                  ? 'Society Administrator'
                  : 'Resident'}
              </div>
            </div>
            <button
              type="button"
              className="btn-sidebar-edit-profile"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditProfileModalOpen(true);
              }}
              title="Edit Profile"
              aria-label="Edit Profile"
            >
              <Settings size={15} />
            </button>
          </div>

          <button
            type="button"
            className="sidebar-signout-btn"
            onClick={handleSignOut}
            title="Sign out of your account"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
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

          {/* Dynamic Global Page Search Box */}
          {isSearchVisible && (
            <div className="header-search-wrapper">
              <Search size={15} className="header-search-icon" />
              <input
                type="text"
                className="header-search-input"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search page content"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="header-search-clear"
                  onClick={clearSearch}
                  aria-label="Clear Search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

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
              ) : isSuperAdmin(userRoles, profile?.email) ? (
                <div
                  className="single-flat-badge-pill"
                  style={{
                    background: '#f0fdfa',
                    borderColor: '#99f6e4',
                    color: '#00685f',
                    fontWeight: 700,
                  }}
                >
                  <Shield size={13} />
                  <span>Society Administrator</span>
                </div>
              ) : null}
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Mobile Quick Flat / Admin Chip */}
            {hasActiveMembership && activeFlat ? (
              <button
                type="button"
                className="mobile-active-flat-chip mobile-only-action"
                onClick={() => setIsMobileDrawerOpen(true)}
                title="View Menu"
              >
                <Building2 size={13} />
                <span>{activeFlat.flat_number}</span>
              </button>
            ) : isSuperAdmin(userRoles, profile?.email) ? (
              <button
                type="button"
                className="mobile-active-flat-chip mobile-only-action"
                onClick={() => setIsMobileDrawerOpen(true)}
                title="View Menu"
              >
                <Shield size={13} />
                <span>Admin</span>
              </button>
            ) : null}
          </div>
        </header>

        {/* Mobile Left Navigation Drawer (Slide-out) */}
        {isMobileDrawerOpen && (
          <div className="mobile-drawer-overlay animate-fade-in" onClick={() => setIsMobileDrawerOpen(false)}>
            <div className="mobile-drawer-content animate-slide-left" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-drawer-header">
                <div className="drawer-brand">
                  <img src="/bps-logo.png" alt="BPS Twin Towers" className="drawer-logo" />
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

              {/* Resident Profile Card */}
              <div className="drawer-profile-card">
                <div className="drawer-profile-top">
                  <div className="drawer-avatar">
                    {profile?.photo_url ? (
                      <img
                        src={profile.photo_url}
                        alt="Avatar"
                        style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'R'
                    )}
                  </div>
                  <div className="drawer-profile-info">
                    <div className="drawer-user-name">{profile?.full_name || 'Resident'}</div>
                    <div className="drawer-user-email">{profile?.email}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-drawer-edit-profile"
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      setIsEditProfileModalOpen(true);
                    }}
                    title="Edit Profile"
                    aria-label="Edit Profile"
                  >
                    <Settings size={16} />
                  </button>
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
                <div className="drawer-section-title">Community Menu</div>
                <div className="drawer-nav-list">
                  {generalNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isNavActive(item.path, item.exact);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`drawer-nav-item ${active ? 'active-nav' : ''}`}
                        onClick={() => {
                          setIsMobileDrawerOpen(false);
                          navigate(item.path);
                        }}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}

                  {activeFlat && menuVisibility.household && (
                    <button
                      type="button"
                      className="drawer-nav-item"
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        handleOpenHousehold(activeFlat);
                      }}
                    >
                      <User size={16} />
                      <span>My Household</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Management Section (Mobile Drawer) */}
              {managementNavItems.length > 0 && (
                <div className="drawer-section">
                  <div className="drawer-section-title">Administration</div>
                  <div className="drawer-nav-list">
                    {managementNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isNavActive(item.path, item.exact);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`drawer-nav-item management-item ${active ? 'active-nav' : ''}`}
                          onClick={() => {
                            setIsMobileDrawerOpen(false);
                            navigate(item.path);
                          }}
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}

                    {isSuperAdminUser && (
                      <button
                        type="button"
                        className="drawer-nav-item management-item"
                        onClick={() => {
                          setIsMobileDrawerOpen(false);
                          setIsMenuVisibilityModalOpen(true);
                        }}
                        style={{ color: '#0d9488' }}
                      >
                        <Sliders size={16} />
                        <span>Resident Menus Config</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

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
          {children || <Outlet />}
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

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          onProfileUpdated={(updated) => {
            setProfile((prev: any) => ({ ...prev, ...updated }));
          }}
          userRoles={userRoles}
          accessList={access}
        />
      )}

      {/* Menu Visibility Settings Modal for Admins */}
      <MenuVisibilityModal
        isOpen={isMenuVisibilityModalOpen}
        onClose={() => setIsMenuVisibilityModalOpen(false)}
        onSuccess={() => {
          setMenuVisibility(getMenuVisibility());
        }}
      />
    </div>
  );
};

