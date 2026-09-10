import {
  Home,
  Calendar,
  CreditCard,
  Bell,
  Building2,
  Wrench,
  Users,
  Megaphone,
  HeartHandshake,
  Shield,
  Award,
  Sparkles,
  HandHelping,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  section: 'general' | 'management';
  requiredRoles?: string[];
  exact?: boolean;
}

export const NAVIGATION_ITEMS: NavItemConfig[] = [
  // ==========================================
  // 1. GENERAL RESIDENT MENUS (Visible to all)
  // ==========================================
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: Home,
    section: 'general',
    exact: true,
  },
  {
    id: 'events',
    label: 'Events & Festivals',
    path: '/events',
    icon: Calendar,
    section: 'general',
  },
  {
    id: 'ganesh-utsav',
    label: 'Ganesh Utsav 2026',
    path: '/ganesh-utsav',
    icon: Sparkles,
    section: 'general',
  },
  {
    id: 'facilities',
    label: 'Amenities & Bookings',
    path: '/facilities',
    icon: Building2,
    section: 'general',
  },
  {
    id: 'complaints',
    label: 'Complaints & Service',
    path: '/complaints',
    icon: Wrench,
    section: 'general',
  },
  {
    id: 'visitors',
    label: 'Visitor Passes',
    path: '/my-visitors',
    icon: Users,
    section: 'general',
  },
  {
    id: 'donations',
    label: 'My Contributions',
    path: '/donations',
    icon: CreditCard,
    section: 'general',
  },
  {
    id: 'volunteers',
    label: 'Volunteer Ops',
    path: '/volunteers',
    icon: HeartHandshake,
    section: 'general',
  },
  {
    id: 'announcements',
    label: 'Announcements',
    path: '/announcements',
    icon: Megaphone,
    section: 'general',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/notifications',
    icon: Bell,
    section: 'general',
  },
  {
    id: 'profile',
    label: 'My Profile',
    path: '/profile',
    icon: Users,
    section: 'general',
  },


  // ==========================================
  // 2. MANAGEMENT MENUS (Filtered by roles)
  // ==========================================
  {
    id: 'admin-overview',
    label: 'Society Admin Console',
    path: '/admin',
    icon: Shield,
    section: 'management',
    exact: true,
    requiredRoles: ['admin', 'super_admin', 'society admin'],
  },
  {
    id: 'admin-permissions',
    label: 'Roles & Permissions',
    path: '/permissions',
    icon: Shield,
    section: 'management',
    requiredRoles: ['admin', 'super_admin', 'society admin'],
  },
  {
    id: 'admin-events',
    label: 'Event Management',
    path: '/events-manage',
    icon: Calendar,
    section: 'management',
    requiredRoles: ['admin', 'event', 'festival', 'culture'],
  },
  {
    id: 'admin-facilities',
    label: 'Facility Bookings Admin',
    path: '/facilities-manage',
    icon: Building2,
    section: 'management',
    requiredRoles: ['admin', 'facility', 'helpdesk'],
  },
  {
    id: 'admin-complaints',
    label: 'Complaints Console',
    path: '/complaints-manage',
    icon: Wrench,
    section: 'management',
    requiredRoles: ['admin', 'facility', 'helpdesk', 'maintenance'],
  },
  {
    id: 'admin-finance',
    label: 'Donations & Finance',
    path: '/finance-manage',
    icon: Award,
    section: 'management',
    requiredRoles: ['admin', 'finance', 'treasurer', 'accounts'],
  },
  {
    id: 'admin-volunteers',
    label: 'Volunteer Coordination',
    path: '/volunteers-manage',
    icon: HandHelping,
    section: 'management',
    requiredRoles: ['admin', 'volunteer'],
  },
  {
    id: 'admin-sponsors',
    label: 'Sponsors & Partners',
    path: '/sponsors-manage',
    icon: Sparkles,
    section: 'management',
    requiredRoles: ['admin', 'finance', 'sponsor'],
  },
  {
    id: 'admin-communications',
    label: 'Notice Board Admin',
    path: '/communications-manage',
    icon: Megaphone,
    section: 'management',
    requiredRoles: ['admin', 'communication', 'pr'],
  },
  {
    id: 'security-console',
    label: 'Security & Gate Pass',
    path: '/security',
    icon: Shield,
    section: 'management',
    requiredRoles: ['admin', 'security', 'gate'],
  },
];
