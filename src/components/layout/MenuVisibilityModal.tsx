import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Home,
  Calendar,
  Building2,
  Wrench,
  Users,
  User,
  CreditCard,
  HeartHandshake,
  Megaphone,
  Bell,
  UserCheck,
  RotateCcw,
  Check,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  getMenuVisibility,
  saveMenuVisibility,
  resetMenuVisibility,
  DEFAULT_MENU_VISIBILITY,
  MENU_ITEM_METADATA,
  type MenuVisibilityConfig,
} from '../../services/menuVisibilityService';
import './MenuVisibilityModal.css';

interface MenuVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MenuVisibilityModal: React.FC<MenuVisibilityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [config, setConfig] = useState<MenuVisibilityConfig>(DEFAULT_MENU_VISIBILITY);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getMenuVisibility());
      setSavedToast(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof MenuVisibilityConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    await saveMenuVisibility(config);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      if (onSuccess) onSuccess();
      onClose();
    }, 500);
  };

  const handleApplyDefaults = () => {
    setConfig({ ...DEFAULT_MENU_VISIBILITY });
  };

  const handleShowAll = () => {
    setConfig({
      dashboard: true,
      events: true,
      facilities: true,
      complaints: true,
      visitors: true,
      household: true,
      donations: true,
      volunteers: true,
      announcements: true,
      notifications: true,
      profile: true,
    });
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home':
        return <Home size={18} />;
      case 'Calendar':
        return <Calendar size={18} />;
      case 'Building2':
        return <Building2 size={18} />;
      case 'Wrench':
        return <Wrench size={18} />;
      case 'Users':
        return <Users size={18} />;
      case 'User':
        return <User size={18} />;
      case 'CreditCard':
        return <CreditCard size={18} />;
      case 'HeartHandshake':
        return <HeartHandshake size={18} />;
      case 'Megaphone':
        return <Megaphone size={18} />;
      case 'Bell':
        return <Bell size={18} />;
      case 'UserCheck':
        return <UserCheck size={18} />;
      default:
        return <Sliders size={18} />;
    }
  };

  const menuKeys = Object.keys(MENU_ITEM_METADATA) as (keyof MenuVisibilityConfig)[];

  return (
    <div className="menu-visibility-backdrop" onClick={onClose}>
      <div className="menu-visibility-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="menu-visibility-header">
          <div>
            <h3 className="menu-visibility-title">
              <Sliders size={20} color="#0d9488" />
              <span>Resident Menu Visibility Settings</span>
            </h3>
            <p className="menu-visibility-subtitle">
              Choose which menus and feature modules are visible to regular society residents. Admins always have access to all management consoles.
            </p>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body Items List */}
        <div className="menu-visibility-body">
          {menuKeys.map((key) => {
            const meta = MENU_ITEM_METADATA[key];
            const isVisible = config[key];

            return (
              <div
                key={key}
                className={`menu-visibility-item-row ${!isVisible ? 'hidden-item' : ''}`}
              >
                <div className="menu-item-left">
                  <div className={`menu-item-icon-wrap ${!isVisible ? 'disabled' : ''}`}>
                    {renderIcon(meta.iconName)}
                  </div>
                  <div className="menu-item-info">
                    <div className="menu-item-title-row">
                      <span className="menu-item-label">{meta.label}</span>
                      <span className={`menu-status-pill ${isVisible ? 'visible' : 'hidden'}`}>
                        {isVisible ? (
                          <>
                            <Eye size={10} style={{ marginRight: '3px' }} /> Visible
                          </>
                        ) : (
                          <>
                            <EyeOff size={10} style={{ marginRight: '3px' }} /> Hidden for Residents
                          </>
                        )}
                      </span>
                    </div>
                    <p className="menu-item-desc">{meta.description}</p>
                  </div>
                </div>

                <label className="switch-toggle" title={`Toggle ${meta.label}`}>
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => handleToggle(key)}
                  />
                  <span className="slider-round" />
                </label>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="menu-visibility-footer">
          <div className="btn-preset-group">
            <button
              type="button"
              className="btn-preset-action"
              onClick={handleApplyDefaults}
              title="Hide Amenities, Complaints, Visitors, Household for residents"
            >
              <RotateCcw size={12} style={{ marginRight: '4px' }} />
              Hide Inactive Menus
            </button>
            <button
              type="button"
              className="btn-preset-action"
              onClick={handleShowAll}
              title="Show all menus to residents"
            >
              Show All
            </button>
          </div>

          <div className="btn-footer-right">
            <button type="button" className="btn-cancel-vis" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-save-vis" onClick={handleSave}>
              {savedToast ? (
                <>
                  <Check size={15} /> Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
