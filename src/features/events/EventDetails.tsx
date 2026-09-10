import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit2,
  Plus,
  Trash2,
  X,
  Target,
  IndianRupee,
  Wallet,
  Megaphone,
  Share2,
  HeartHandshake,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import {
  fetchEventDetails,
  registerForEvent,
  cancelEventRegistration,
  updateAdminEvent,
  type EventItem,
  type EventCategory,
} from '../../services/supabase/eventService';
import { fetchUserRoles } from '../../services/supabase/adminService';
import { resolveUserAccess, type AccessInfo } from '../../services/supabase/registrationService';
import { hasRequiredRole, isSuperAdmin } from '../../utils/rbac';
import { PoojaBookingModal } from './PoojaBookingModal';
import { DonationModal } from '../donations/DonationModal';
import { type CampaignItem, type CampaignCategory } from '../../services/supabase/financeService';
import './EventDetails.css';

interface FlatMember {
  id: string;
  full_name: string | null;
  relationship: string;
  resident_type: string | null;
  mobile: string | null;
  email: string | null;
}

interface ScheduleItem {
  id: string;
  day_label: string;
  title: string;
  description: string;
  time_info: string;
}

interface TeamMember {
  id: string;
  name: string;
  role_title: string;
  responsibility: string;
  avatar_url?: string;
}

interface EventUpdate {
  id: string;
  title: string;
  time_ago: string;
  content: string;
  posted_by: string;
}

interface GoalMetrics {
  collected: number;
  target: number;
  contributors: number;
  remaining: number;
}

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  {
    id: 'sch-1',
    day_label: 'Day 1',
    title: 'Ganesh Ji Sthapana',
    description: 'Auspicious idol installation and collective prayers (with us for 5 days).',
    time_info: 'Sep 14, 9:00 AM',
  },
  {
    id: 'sch-2',
    day_label: 'Daily',
    title: 'Daily Pooja & Cultural Activities',
    description: 'Pooja twice morning & evening (7:00 PM), games for kids, bhajans & fun activities.',
    time_info: 'Daily, 7:00 PM',
  },
  {
    id: 'sch-3',
    day_label: 'Day 6',
    title: 'Laddu Auction & Immersion (Visarjan)',
    description: 'Laddu Auction at 4:00 PM, followed by Grand Immersion departure at 6:00 PM sharp.',
    time_info: 'Sep 19, 4:00 PM & 6:00 PM',
  },
];

const DEFAULT_TEAM: TeamMember[] = [
  {
    id: 'team-1',
    name: 'Amit Patel',
    role_title: 'Treasurer, Block A',
    responsibility: 'Handles finances & clearance tickets',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'team-2',
    name: 'Meera Nair',
    role_title: 'Cultural Lead, Block B',
    responsibility: 'Curates dances & performances',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'team-3',
    name: 'Vikram Malhotra',
    role_title: 'Logistics Lead, Block C',
    responsibility: 'Setup, security & catering',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  },
];

const DEFAULT_UPDATES: EventUpdate[] = [
  {
    id: 'up-1',
    title: 'Decoration Work Started',
    time_ago: 'Yesterday, 4:30 PM',
    content: 'Catering and lighting setups have arrived. Volunteers needed for evening decorations.',
    posted_by: 'Posted by Admin',
  },
  {
    id: 'up-2',
    title: 'Food Arrangements Finalized',
    time_ago: '12 Sep, 10:00 AM',
    content: 'Maha Prasad catering signed with Swad Restaurant. Coupons distributed to all flats.',
    posted_by: 'Posted by Admin',
  },
  {
    id: 'up-3',
    title: 'Final Schedule Published',
    time_ago: '10 Sep, 2:15 PM',
    content: 'Visarjan routes and time slots locked in alignment with local authorities.',
    posted_by: 'Posted by Admin',
  },
];

export interface SpecialSponsorItem {
  id: string;
  category_title: string;
  sponsor_name: string;
  flat_info: string;
  icon_type?: string;
  tagline?: string;
}

export const DEFAULT_SPECIAL_SPONSORS: SpecialSponsorItem[] = [
  {
    id: 'sp-1',
    category_title: 'IDOL SPONSOR',
    sponsor_name: 'Sanjay Banerjee',
    flat_info: 'Flat A-1711',
    icon_type: 'idol',
    tagline: 'Main Altar Clay Murti Seva',
  },
  {
    id: 'sp-2',
    category_title: 'PUJARI SPONSOR',
    sponsor_name: 'Chandra Shekhar V',
    flat_info: 'Flat B-1609',
    icon_type: 'pujari',
    tagline: 'Daily Vedic Rituals & Mantras',
  },
  {
    id: 'sp-3',
    category_title: 'POOJA ITEM SPONSOR',
    sponsor_name: 'Nagoju Praveen',
    flat_info: 'Flat B-606',
    icon_type: 'pooja_item',
    tagline: 'Samagri, Flowers & Deepam',
  },
  {
    id: 'sp-4',
    category_title: 'DAILY PRASADAM SPONSOR',
    sponsor_name: 'Chandra Shekhar V',
    flat_info: 'Flat B-1609',
    icon_type: 'daily_prasadam',
    tagline: 'Evening Aarti Maha Naivedya',
  },
  {
    id: 'sp-5',
    category_title: 'MAHAPRASADAM SPONSOR',
    sponsor_name: 'Mahidhar',
    flat_info: 'Flat A-1701',
    icon_type: 'mahaprasadam',
    tagline: 'Grand Community Feast for 800+ Residents',
  },
  {
    id: 'sp-6',
    category_title: 'LADDU SPONSOR',
    sponsor_name: 'Siddharth Giri',
    flat_info: 'Flat B-1206',
    icon_type: 'laddu',
    tagline: 'Special Modak & Maha Laddu Bhog',
  },
];

export const getSponsorIconEmoji = (iconType?: string, categoryTitle?: string) => {
  const type = (iconType || categoryTitle || '').toLowerCase();
  if (type.includes('idol') || type.includes('murti')) return '🪔';
  if (type.includes('pujari') || type.includes('bell') || type.includes('archana')) return '🔔';
  if (type.includes('pooja') || type.includes('item') || type.includes('samagri') || type.includes('thali')) return '🕯️';
  if (type.includes('daily') || type.includes('evening')) return '🍚';
  if (type.includes('mahaprasad') || type.includes('feast') || type.includes('bhojan')) return '🍲';
  if (type.includes('laddu') || type.includes('modak') || type.includes('sweet')) return '🟡';
  return '⭐';
};

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeAccess, setActiveAccess] = useState<AccessInfo[]>([]);
  const [householdMembers, setHouseholdMembers] = useState<FlatMember[]>([]);
  const [userRegistration, setUserRegistration] = useState<any | null>(null);

  // Dynamic Event Modules (persisted locally per event id)
  const [goalMetrics, setGoalMetrics] = useState<GoalMetrics>({
    collected: 85000,
    target: 120000,
    contributors: 125,
    remaining: 35000,
  });
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>(DEFAULT_SCHEDULE);
  const [teamList, setTeamList] = useState<TeamMember[]>(DEFAULT_TEAM);
  const [updatesList, setUpdatesList] = useState<EventUpdate[]>(DEFAULT_UPDATES);

  // Registration Form states
  const [selectedPersonType, setSelectedPersonType] = useState<'self' | string>('self');
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participantMobile, setParticipantMobile] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals for Admin Editing
  const [isEditHeaderOpen, setIsEditHeaderOpen] = useState(false);
  const [isEditGoalsOpen, setIsEditGoalsOpen] = useState(false);
  const [isEditAboutOpen, setIsEditAboutOpen] = useState(false);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<ScheduleItem | null>(null);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<TeamMember | null>(null);
  const [isPostUpdateOpen, setIsPostUpdateOpen] = useState(false);

  // Resident Action Modals
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isPoojaModalOpen, setIsPoojaModalOpen] = useState(false);

  // Form states for Header Edit
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<EventCategory>('Festival');
  const [editVenue, setEditVenue] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editAboutText, setEditAboutText] = useState('');

  // Form states for Goals Edit
  const [goalTarget, setGoalTarget] = useState(120000);
  const [goalCollected, setGoalCollected] = useState(85000);
  const [goalContributors, setGoalContributors] = useState(125);

  // Form states for Schedule Item
  const [formDayLabel, setFormDayLabel] = useState('Day 1');
  const [formScheduleTitle, setFormScheduleTitle] = useState('');
  const [formScheduleDesc, setFormScheduleDesc] = useState('');
  const [formScheduleTime, setFormScheduleTime] = useState('');

  // Form states for Team Member
  const [formMemberName, setFormMemberName] = useState('');
  const [formMemberRole, setFormMemberRole] = useState('');
  const [formMemberResp, setFormMemberResp] = useState('');
  const [formMemberAvatar, setFormMemberAvatar] = useState('');

  // Form states for Announcement Update
  const [formUpdateTitle, setFormUpdateTitle] = useState('');
  const [formUpdateContent, setFormUpdateContent] = useState('');

  // Form states for Special Sponsors
  const [specialSponsorsList, setSpecialSponsorsList] = useState<SpecialSponsorItem[]>(DEFAULT_SPECIAL_SPONSORS);
  const [isEditSponsorOpen, setIsEditSponsorOpen] = useState(false);
  const [sponsorToEdit, setSponsorToEdit] = useState<SpecialSponsorItem | null>(null);
  const [formSponsorCategory, setFormSponsorCategory] = useState('IDOL SPONSOR');
  const [formSponsorName, setFormSponsorName] = useState('');
  const [formSponsorFlat, setFormSponsorFlat] = useState('');
  const [formSponsorTagline, setFormSponsorTagline] = useState('');
  const [formSponsorIcon, setFormSponsorIcon] = useState('idol');

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setActionError(null);

      const [eventData, accessData] = await Promise.all([
        fetchEventDetails(id),
        resolveUserAccess().catch(() => []),
      ]);

      setEvent(eventData);
      setActiveAccess(accessData);

      if (eventData) {
        setEditTitle(eventData.title);
        setEditCategory(eventData.category);
        setEditVenue(eventData.venue);
        setEditStartDate(eventData.start_date);
        setEditStartTime(eventData.start_time);
        setEditEndDate(eventData.end_date);
        setEditEndTime(eventData.end_time);
        setEditBannerUrl(eventData.banner_url || '');
        setEditAboutText(
          eventData.description ||
            `Join us for our community's most beloved annual festivity as we welcome Lord Ganesha with open hearts. This year, flat representatives from Towers A through E have collaboratively mapped out sustainable green celebrations, including clay idols, zero chemical colors, and reusable decor arrays. Contributions go directly towards main altar setups, puja supplies, collective maha-prasad, and daily evening cultural events.`
        );
      }

      // Check user role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const roles = await fetchUserRoles();
        const hasAdminClearance =
          isSuperAdmin(roles, user.email) ||
          hasRequiredRole(roles, ['admin', 'event', 'festival', 'culture', 'super_admin', 'society admin'], user.email);
        setIsAdmin(hasAdminClearance);

        // Fetch current user's profile to default form
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setParticipantName(profile.full_name || '');
          setParticipantEmail(profile.email || '');
          setParticipantMobile(profile.mobile || '');
        }

        // Fetch user's existing registration for this event
        const { data: existingReg } = await supabase
          .from('event_registrations')
          .select('*')
          .eq('event_id', id)
          .eq('user_id', user.id)
          .eq('status', 'Confirmed')
          .maybeSingle();

        setUserRegistration(existingReg);

        // Load household members if has flat
        if (accessData.length > 0) {
          const flatId = accessData[0].flat_id;
          const { data: members } = await supabase
            .from('flat_members')
            .select('id, full_name, relationship, resident_type, mobile, email')
            .eq('flat_id', flatId)
            .eq('status', 'Active');

          setHouseholdMembers(members || []);
        }
      }

      // Load customized modules from Supabase metadata (fallback to localStorage or defaults)
      if (eventData?.metadata) {
        if (eventData.metadata.goals) setGoalMetrics(eventData.metadata.goals);
        if (eventData.metadata.schedule && Array.isArray(eventData.metadata.schedule) && eventData.metadata.schedule.length > 0) {
          setScheduleList(eventData.metadata.schedule);
        }
        if (eventData.metadata.team && Array.isArray(eventData.metadata.team) && eventData.metadata.team.length > 0) {
          setTeamList(eventData.metadata.team);
        }
        if (eventData.metadata.updates && Array.isArray(eventData.metadata.updates) && eventData.metadata.updates.length > 0) {
          setUpdatesList(eventData.metadata.updates);
        }
        if (eventData.metadata.special_sponsors && Array.isArray(eventData.metadata.special_sponsors) && eventData.metadata.special_sponsors.length > 0) {
          setSpecialSponsorsList(eventData.metadata.special_sponsors);
        }
      } else {
        const savedGoals = localStorage.getItem(`event_goals_${id}`);
        if (savedGoals) {
          try {
            setGoalMetrics(JSON.parse(savedGoals));
          } catch (_) {}
        }

        const savedSchedule = localStorage.getItem(`event_schedule_${id}`);
        if (savedSchedule) {
          try {
            setScheduleList(JSON.parse(savedSchedule));
          } catch (_) {}
        }

        const savedTeam = localStorage.getItem(`event_team_${id}`);
        if (savedTeam) {
          try {
            setTeamList(JSON.parse(savedTeam));
          } catch (_) {}
        }

        const savedUpdates = localStorage.getItem(`event_updates_${id}`);
        if (savedUpdates) {
          try {
            setUpdatesList(JSON.parse(savedUpdates));
          } catch (_) {}
        }

        const savedSponsors = localStorage.getItem(`event_special_sponsors_${id}`);
        if (savedSponsors) {
          try {
            setSpecialSponsorsList(JSON.parse(savedSponsors));
          } catch (_) {}
        }
      }
    } catch (err: any) {
      console.error('Error loading event details:', err);
      setActionError('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const syncMetadataToDatabase = async (newMetaPartial: any) => {
    if (!id) return;
    const currentMeta = event?.metadata || {};
    const updatedMeta = { ...currentMeta, ...newMetaPartial };
    try {
      await updateAdminEvent(id, { metadata: updatedMeta });
      if (event) {
        setEvent({ ...event, metadata: updatedMeta });
      }
    } catch (err) {
      console.error('Failed to sync event metadata to Supabase:', err);
    }
  };

  // Handle Save Event Header
  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editTitle.trim() || !editVenue.trim()) return;

    try {
      setSubmitting(true);
      await updateAdminEvent(id, {
        title: editTitle.trim(),
        category: editCategory,
        venue: editVenue.trim(),
        start_date: editStartDate,
        start_time: editStartTime,
        end_date: editEndDate,
        end_time: editEndTime,
        banner_url: editBannerUrl.trim() || null,
      });

      setIsEditHeaderOpen(false);
      setActionSuccess('Event header details updated successfully.');
      await loadData();
    } catch (err: any) {
      console.error('Failed to update event header:', err);
      setActionError(err.message || 'Failed to update event details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Save About Description
  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSubmitting(true);
      await updateAdminEvent(id, {
        description: editAboutText.trim(),
      });

      setIsEditAboutOpen(false);
      setActionSuccess('Event description updated successfully.');
      await loadData();
    } catch (err: any) {
      console.error('Failed to update event description:', err);
      setActionError(err.message || 'Failed to update event description.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Save Goal Metrics
  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    const remaining = Math.max(0, goalTarget - goalCollected);
    const updated: GoalMetrics = {
      target: goalTarget,
      collected: goalCollected,
      contributors: goalContributors,
      remaining,
    };
    setGoalMetrics(updated);
    if (id) {
      localStorage.setItem(`event_goals_${id}`, JSON.stringify(updated));
    }
    syncMetadataToDatabase({ goals: updated });
    setIsEditGoalsOpen(false);
    setActionSuccess('Funding goal metrics updated.');
  };

  // Handle Save Schedule Item (Add or Edit)
  const handleSaveScheduleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formScheduleTitle.trim()) return;

    let updated: ScheduleItem[];
    if (scheduleToEdit) {
      updated = scheduleList.map((item) =>
        item.id === scheduleToEdit.id
          ? {
              ...item,
              day_label: formDayLabel,
              title: formScheduleTitle.trim(),
              description: formScheduleDesc.trim(),
              time_info: formScheduleTime.trim(),
            }
          : item
      );
    } else {
      const newItem: ScheduleItem = {
        id: `sch-${Date.now()}`,
        day_label: formDayLabel,
        title: formScheduleTitle.trim(),
        description: formScheduleDesc.trim(),
        time_info: formScheduleTime.trim(),
      };
      updated = [...scheduleList, newItem];
    }

    setScheduleList(updated);
    if (id) localStorage.setItem(`event_schedule_${id}`, JSON.stringify(updated));
    syncMetadataToDatabase({ schedule: updated });
    setIsEditScheduleOpen(false);
    setScheduleToEdit(null);
    setActionSuccess('Schedule timeline updated.');
  };

  const handleDeleteScheduleItem = (itemId: string) => {
    const updated = scheduleList.filter((item) => item.id !== itemId);
    setScheduleList(updated);
    if (id) localStorage.setItem(`event_schedule_${id}`, JSON.stringify(updated));
    syncMetadataToDatabase({ schedule: updated });
    setActionSuccess('Schedule item removed.');
  };

  // Handle Save Team Member (Add or Edit)
  const handleSaveTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMemberName.trim()) return;

    let updated: TeamMember[];
    if (teamToEdit) {
      updated = teamList.map((m) =>
        m.id === teamToEdit.id
          ? {
              ...m,
              name: formMemberName.trim(),
              role_title: formMemberRole.trim(),
              responsibility: formMemberResp.trim(),
              avatar_url: formMemberAvatar.trim() || undefined,
            }
          : m
      );
    } else {
      const newMember: TeamMember = {
        id: `team-${Date.now()}`,
        name: formMemberName.trim(),
        role_title: formMemberRole.trim(),
        responsibility: formMemberResp.trim(),
        avatar_url: formMemberAvatar.trim() || undefined,
      };
      updated = [...teamList, newMember];
    }

    setTeamList(updated);
    if (id) localStorage.setItem(`event_team_${id}`, JSON.stringify(updated));
    syncMetadataToDatabase({ team: updated });
    setIsEditTeamOpen(false);
    setTeamToEdit(null);
    setActionSuccess('Organizing team updated.');
  };

  const handleDeleteTeamMember = (memberId: string) => {
    const updated = teamList.filter((m) => m.id !== memberId);
    setTeamList(updated);
    if (id) localStorage.setItem(`event_team_${id}`, JSON.stringify(updated));
    syncMetadataToDatabase({ team: updated });
    setActionSuccess('Team member removed.');
  };

  // Handle Post Announcement Update
  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUpdateTitle.trim()) return;

    const newUp: EventUpdate = {
      id: `up-${Date.now()}`,
      title: formUpdateTitle.trim(),
      time_ago: 'Just now',
      content: formUpdateContent.trim(),
      posted_by: 'Posted by Admin',
    };

    const updated = [newUp, ...updatesList];
    setUpdatesList(updated);
    if (id) localStorage.setItem(`event_updates_${id}`, JSON.stringify(updated));
    syncMetadataToDatabase({ updates: updated });
    setIsPostUpdateOpen(false);
    setFormUpdateTitle('');
    setFormUpdateContent('');
    setActionSuccess('Announcement bulletin posted.');
  };

  const handleDeleteUpdate = (updateId: string) => {
    const updated = updatesList.filter((u) => u.id !== updateId);
    setUpdatesList(updated);
    if (id) localStorage.setItem(`event_updates_${id}`, JSON.stringify(updated));
    syncMetadataToDatabase({ updates: updated });
    setActionSuccess('Announcement removed.');
  };

  // Handle Save Special Sponsor (Add or Edit)
  const handleSaveSpecialSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSponsorName.trim() || !formSponsorCategory.trim()) return;

    let updated: SpecialSponsorItem[];
    if (sponsorToEdit) {
      updated = specialSponsorsList.map((s) =>
        s.id === sponsorToEdit.id
          ? {
              ...s,
              category_title: formSponsorCategory.trim().toUpperCase(),
              sponsor_name: formSponsorName.trim(),
              flat_info: formSponsorFlat.trim(),
              tagline: formSponsorTagline.trim(),
              icon_type: formSponsorIcon,
            }
          : s
      );
    } else {
      const newSponsor: SpecialSponsorItem = {
        id: `sp-${Date.now()}`,
        category_title: formSponsorCategory.trim().toUpperCase(),
        sponsor_name: formSponsorName.trim(),
        flat_info: formSponsorFlat.trim(),
        tagline: formSponsorTagline.trim(),
        icon_type: formSponsorIcon,
      };
      updated = [...specialSponsorsList, newSponsor];
    }

    setSpecialSponsorsList(updated);
    if (id) localStorage.setItem(`event_special_sponsors_${id}`, JSON.stringify(updated));
    syncMetadataToDatabase({ special_sponsors: updated });
    setIsEditSponsorOpen(false);
    setSponsorToEdit(null);
    setActionSuccess('Special sponsor details updated.');
  };

  const handleDeleteSpecialSponsor = (sponsorId: string) => {
    const updated = specialSponsorsList.filter((s) => s.id !== sponsorId);
    setSpecialSponsorsList(updated);
    if (id) localStorage.setItem(`event_special_sponsors_${id}`, JSON.stringify(updated));
    syncMetadataToDatabase({ special_sponsors: updated });
    setActionSuccess('Special sponsor removed.');
  };

  // Resident Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !id) return;

    try {
      setSubmitting(true);
      setActionError(null);

      const flatId = activeAccess[0]?.flat_id;
      const flatMemberId = selectedPersonType === 'self' ? undefined : selectedPersonType;
      const selectedMember = householdMembers.find((m) => m.id === flatMemberId);

      await registerForEvent({
        event_id: id,
        flat_id: flatId,
        flat_member_id: flatMemberId,
        participant_name: participantName,
        participant_email: participantEmail,
        participant_mobile: participantMobile,
        participant_type: selectedMember ? selectedMember.relationship : 'Primary Resident',
        quantity: quantity,
        notes: notes,
      });

      setActionSuccess('Successfully registered for this event!');
      await loadData();
    } catch (err: any) {
      console.error('Registration error:', err);
      setActionError(err.message || 'Failed to register for event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!userRegistration) return;
    const confirmCancel = window.confirm('Are you sure you want to cancel your registration?');
    if (!confirmCancel) return;

    try {
      setSubmitting(true);
      setActionError(null);
      await cancelEventRegistration(userRegistration.id);
      setActionSuccess('Registration cancelled successfully.');
      await loadData();
    } catch (err: any) {
      console.error('Cancellation error:', err);
      setActionError(err.message || 'Failed to cancel registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="event-details-page flex-center" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
          Loading event details...
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-details-page">
        <div className="event-details-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <h2>Event Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            This event may have been removed or is not currently available.
          </p>
          <button className="btn-contribute-primary" onClick={() => navigate('/events')}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  // Goal percentage computation
  const fundingPercent = goalMetrics.target > 0 ? Math.min(100, Math.round((goalMetrics.collected / goalMetrics.target) * 100)) : 71;

  // Format date range nicely (e.g. Sep 5 – 15, 2025)
  const formatEventDateRange = () => {
    try {
      const s = new Date(event.start_date);
      const e = new Date(event.end_date);
      const sMonth = s.toLocaleDateString('en-IN', { month: 'short' });
      const sDay = s.getDate();
      const eDay = e.getDate();
      const sYear = s.getFullYear();
      if (event.start_date === event.end_date) {
        return `${sMonth} ${sDay}, ${sYear}`;
      }
      return `${sMonth} ${sDay} – ${eDay}, ${sYear}`;
    } catch (_) {
      return `${event.start_date} – ${event.end_date}`;
    }
  };

  // Convert campaign item for DonationModal
  const campaignCategory: CampaignCategory =
    event.category === 'Festival' || event.category === 'Cultural' || event.category === 'Sports'
      ? event.category
      : 'Festival';

  const campaignItem: CampaignItem = {
    id: id || 'event-campaign',
    title: `${event.title} Fund`,
    description: event.description || '',
    category: campaignCategory,
    target_amount: goalMetrics.target,
    start_date: event.start_date,
    end_date: event.end_date,
    banner_url: event.banner_url || null,
    status: 'Active',
    cancellation_reason: null,
    created_by: null,
    created_at: event.created_at,
    updated_at: event.updated_at,
  };

  const heroImageSrc =
    event.banner_url ||
    (event.category === 'Festival'
      ? 'https://images.unsplash.com/photo-1567591370504-20a2bf4762c3?q=80&w=1600&auto=format&fit=crop'
      : event.category === 'Cultural'
      ? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop'
      : 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop');

  return (
    <div className="event-details-page animate-fade-in">
      <div className="event-details-container">
        {/* Breadcrumb Navigation */}
        <div className="event-breadcrumb">
          <span className="event-breadcrumb-link" onClick={() => navigate('/events')}>
            Events
          </span>
          <span className="event-breadcrumb-separator">/</span>
          <span className="event-breadcrumb-current">{event.title}</span>
        </div>

        {/* Hero Festive Banner */}
        <div className="event-festive-hero">
          <img
            src={heroImageSrc}
            alt={event.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1567591370504-20a2bf4762c3?q=80&w=1600&auto=format&fit=crop';
            }}
          />
          <div className="event-festive-hero-overlay" />
          {isAdmin && (
            <div className="hero-admin-badge">
              <ShieldCheck size={14} />
              <span>Admin Mode Active</span>
            </div>
          )}
        </div>

        {/* Action Alerts */}
        {actionSuccess && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              color: '#065f46',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} color="#059669" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#065f46' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {actionError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} color="#dc2626" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#991b1b' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Main Event Header Card */}
        <div className="event-header-card">
          <div className="event-header-info">
            <h1 className="event-header-title">{event.title}</h1>
            <div className="event-meta-tags-row">
              <div className="event-meta-tag-item">
                <Calendar size={16} color="#64748b" />
                <span>{formatEventDateRange()}</span>
              </div>
              <div className="event-meta-tag-item">
                <Clock size={16} color="#64748b" />
                <span>{event.start_time} onwards</span>
              </div>
              <div className="event-meta-tag-item">
                <MapPin size={16} color="#64748b" />
                <span>{event.venue}</span>
              </div>
              <span className="event-active-pill">
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#059669',
                    display: 'inline-block',
                  }}
                />
                Active
              </span>
            </div>
          </div>

          <div className="event-header-actions">
            {isAdmin && (
              <button
                className="btn-admin-edit"
                onClick={() => {
                  setEditTitle(event.title);
                  setEditCategory(event.category);
                  setEditVenue(event.venue);
                  setEditStartDate(event.start_date);
                  setEditStartTime(event.start_time);
                  setEditEndDate(event.end_date);
                  setEditEndTime(event.end_time);
                  setEditBannerUrl(event.banner_url || '');
                  setIsEditHeaderOpen(true);
                }}
              >
                <Edit2 size={15} />
                <span>Edit Event</span>
              </button>
            )}

            <button
              className="btn-contribute-primary"
              onClick={() => setIsDonationModalOpen(true)}
            >
              <HeartHandshake size={16} />
              <span>Contribute Now</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards Row */}
        <div className="event-metrics-grid">
          {/* Card 1: Collected */}
          <div className="metric-stat-card">
            <div className="metric-icon-circle mint">
              <IndianRupee size={20} />
            </div>
            <div className="metric-stat-content">
              <span className="metric-stat-label">Collected</span>
              <div className="metric-stat-value">₹{goalMetrics.collected.toLocaleString('en-IN')}</div>
              <span className="metric-stat-subtext">Out of ₹{(goalMetrics.target / 100000).toFixed(1)}L target</span>
            </div>
            {isAdmin && (
              <button
                className="card-quick-edit-btn"
                title="Edit Goal Metrics"
                onClick={() => {
                  setGoalTarget(goalMetrics.target);
                  setGoalCollected(goalMetrics.collected);
                  setGoalContributors(goalMetrics.contributors);
                  setIsEditGoalsOpen(true);
                }}
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>

          {/* Card 2: Target */}
          <div className="metric-stat-card">
            <div className="metric-icon-circle teal">
              <Target size={20} />
            </div>
            <div className="metric-stat-content">
              <span className="metric-stat-label">Target</span>
              <div className="metric-stat-value">₹{goalMetrics.target.toLocaleString('en-IN')}</div>
              <span className="metric-stat-subtext">Fixed budget goal</span>
            </div>
            {isAdmin && (
              <button
                className="card-quick-edit-btn"
                title="Edit Goal Metrics"
                onClick={() => {
                  setGoalTarget(goalMetrics.target);
                  setGoalCollected(goalMetrics.collected);
                  setGoalContributors(goalMetrics.contributors);
                  setIsEditGoalsOpen(true);
                }}
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>

          {/* Card 3: Contributors */}
          <div className="metric-stat-card">
            <div className="metric-icon-circle emerald">
              <Users size={20} />
            </div>
            <div className="metric-stat-content">
              <span className="metric-stat-label">Contributors</span>
              <div className="metric-stat-value">{goalMetrics.contributors}</div>
              <span className="metric-stat-subtext">Active flat owners</span>
            </div>
            {isAdmin && (
              <button
                className="card-quick-edit-btn"
                title="Edit Goal Metrics"
                onClick={() => {
                  setGoalTarget(goalMetrics.target);
                  setGoalCollected(goalMetrics.collected);
                  setGoalContributors(goalMetrics.contributors);
                  setIsEditGoalsOpen(true);
                }}
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>

          {/* Card 4: Remaining */}
          <div className="metric-stat-card">
            <div className="metric-icon-circle cyan">
              <Wallet size={20} />
            </div>
            <div className="metric-stat-content">
              <span className="metric-stat-label">Remaining</span>
              <div className="metric-stat-value">₹{goalMetrics.remaining.toLocaleString('en-IN')}</div>
              <span className="metric-stat-subtext">Needed to initiate</span>
            </div>
            {isAdmin && (
              <button
                className="card-quick-edit-btn"
                title="Edit Goal Metrics"
                onClick={() => {
                  setGoalTarget(goalMetrics.target);
                  setGoalCollected(goalMetrics.collected);
                  setGoalContributors(goalMetrics.contributors);
                  setIsEditGoalsOpen(true);
                }}
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Overall Funding Goal Status */}
        <div className="funding-goal-card">
          <div className="funding-goal-header">
            <span className="funding-goal-title">Overall Funding Goal Status</span>
            <span className="funding-goal-pct">{fundingPercent}% Completed</span>
          </div>
          <div className="funding-progress-track">
            <div className="funding-progress-bar" style={{ width: `${fundingPercent}%` }} />
          </div>
        </div>

        {/* Festive Special Sponsors & Seva Patrons Showcase */}
        {specialSponsorsList.length > 0 && (
          <div className="special-sponsors-section animate-fade-in">
            <div className="special-sponsors-header">
              <div className="special-sponsors-title-wrap">
                <div className="festive-emblem-badge">🪔</div>
                <div>
                  <h3 className="special-sponsors-title">
                    {event.title.includes('Ganesh')
                      ? 'GANESH UTSAV 2026 SPECIAL SPONSORS'
                      : 'FESTIVE SPECIAL SPONSORS & SEVA PATRONS'}
                  </h3>
                  <p className="special-sponsors-subtitle">
                    Honoring our devoted society flat owners for their generous festival seva and sponsorships
                  </p>
                </div>
              </div>

              {isAdmin && (
                <button
                  className="section-panel-edit-trigger"
                  onClick={() => {
                    setSponsorToEdit(null);
                    setFormSponsorCategory('IDOL SPONSOR');
                    setFormSponsorName('');
                    setFormSponsorFlat('');
                    setFormSponsorTagline('');
                    setFormSponsorIcon('idol');
                    setIsEditSponsorOpen(true);
                  }}
                  style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309' }}
                >
                  <Plus size={14} />
                  <span>Add Sponsor</span>
                </button>
              )}
            </div>

            <div className="special-sponsors-grid">
              {specialSponsorsList.map((sponsor) => (
                <div key={sponsor.id} className="special-sponsor-card">
                  <div className="special-sponsor-icon-circle">
                    {getSponsorIconEmoji(sponsor.icon_type, sponsor.category_title)}
                  </div>
                  <div className="special-sponsor-info">
                    <span className="special-sponsor-category">{sponsor.category_title}</span>
                    <h4 className="special-sponsor-name">{sponsor.sponsor_name}</h4>
                    <div className="special-sponsor-meta">
                      <span className="special-sponsor-flat-pill">{sponsor.flat_info}</span>
                      {sponsor.tagline && (
                        <span className="special-sponsor-tagline">· {sponsor.tagline}</span>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="special-sponsor-card-actions">
                      <button
                        className="item-action-icon-btn"
                        title="Edit Sponsor"
                        onClick={() => {
                          setSponsorToEdit(sponsor);
                          setFormSponsorCategory(sponsor.category_title);
                          setFormSponsorName(sponsor.sponsor_name);
                          setFormSponsorFlat(sponsor.flat_info);
                          setFormSponsorTagline(sponsor.tagline || '');
                          setFormSponsorIcon(sponsor.icon_type || 'idol');
                          setIsEditSponsorOpen(true);
                        }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="item-action-icon-btn danger"
                        title="Delete Sponsor"
                        onClick={() => handleDeleteSpecialSponsor(sponsor.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2-Column Main Content Layout */}
        <div className="event-content-columns">
          {/* LEFT COLUMN */}
          <div className="content-column-left">
            {/* 1. About This Event Card */}
            <div className="section-panel-card">
              <div className="section-panel-header">
                <h3 className="section-panel-title">About This Event</h3>
                {isAdmin && (
                  <button
                    className="section-panel-edit-trigger"
                    onClick={() => {
                      setEditAboutText(event.description || editAboutText);
                      setIsEditAboutOpen(true);
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Edit About</span>
                  </button>
                )}
              </div>
              <p className="about-event-text">
                {event.description || editAboutText}
              </p>
            </div>

            {/* 2. Event Schedule Card */}
            <div className="section-panel-card">
              <div className="section-panel-header">
                <h3 className="section-panel-title">Event Schedule</h3>
                {isAdmin && (
                  <button
                    className="section-panel-edit-trigger"
                    onClick={() => {
                      setScheduleToEdit(null);
                      setFormDayLabel(`Day ${scheduleList.length + 1}`);
                      setFormScheduleTitle('');
                      setFormScheduleDesc('');
                      setFormScheduleTime('');
                      setIsEditScheduleOpen(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Item</span>
                  </button>
                )}
              </div>

              <div className="schedule-timeline-list">
                {scheduleList.map((item) => (
                  <div key={item.id} className="schedule-timeline-item">
                    <span className="schedule-day-badge">{item.day_label}</span>
                    <div className="schedule-item-body">
                      <h4 className="schedule-item-title">{item.title}</h4>
                      <p className="schedule-item-desc">{item.description}</p>
                      <div className="schedule-item-time">{item.time_info}</div>
                    </div>
                    {isAdmin && (
                      <div className="schedule-item-actions">
                        <button
                          className="item-action-icon-btn"
                          title="Edit Item"
                          onClick={() => {
                            setScheduleToEdit(item);
                            setFormDayLabel(item.day_label);
                            setFormScheduleTitle(item.title);
                            setFormScheduleDesc(item.description);
                            setFormScheduleTime(item.time_info);
                            setIsEditScheduleOpen(true);
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="item-action-icon-btn danger"
                          title="Delete Item"
                          onClick={() => handleDeleteScheduleItem(item.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Organizing Team Card */}
            <div className="section-panel-card">
              <div className="section-panel-header">
                <h3 className="section-panel-title">Organizing Team</h3>
                {isAdmin && (
                  <button
                    className="section-panel-edit-trigger"
                    onClick={() => {
                      setTeamToEdit(null);
                      setFormMemberName('');
                      setFormMemberRole('');
                      setFormMemberResp('');
                      setFormMemberAvatar('');
                      setIsEditTeamOpen(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Member</span>
                  </button>
                )}
              </div>

              <div className="organizing-team-grid">
                {teamList.map((member) => (
                  <div key={member.id} className="organizing-member-card">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="member-avatar" />
                    ) : (
                      <div className="member-avatar-placeholder">
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <div className="member-details">
                      <h5 className="member-name">{member.name}</h5>
                      <div className="member-role">{member.role_title}</div>
                      <p className="member-resp">{member.responsibility}</p>
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <button
                          className="item-action-icon-btn"
                          title="Edit Member"
                          onClick={() => {
                            setTeamToEdit(member);
                            setFormMemberName(member.name);
                            setFormMemberRole(member.role_title);
                            setFormMemberResp(member.responsibility);
                            setFormMemberAvatar(member.avatar_url || '');
                            setIsEditTeamOpen(true);
                          }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          className="item-action-icon-btn danger"
                          title="Delete Member"
                          onClick={() => handleDeleteTeamMember(member.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="content-column-right">
            {/* 1. Updates & Announcements */}
            <div className="section-panel-card">
              <div className="section-panel-header">
                <h3 className="section-panel-title">Updates & Announcements</h3>
                {isAdmin && (
                  <button
                    className="section-panel-edit-trigger"
                    onClick={() => {
                      setFormUpdateTitle('');
                      setFormUpdateContent('');
                      setIsPostUpdateOpen(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>Post Update</span>
                  </button>
                )}
              </div>

              <div className="updates-announcements-list">
                {updatesList.map((update) => (
                  <div key={update.id} className="update-announcement-item">
                    <div className="update-header-row">
                      <div className="update-title-wrap">
                        <Megaphone size={14} color="#0d9488" />
                        <h4 className="update-title">{update.title}</h4>
                      </div>
                      <span className="update-time">{update.time_ago}</span>
                    </div>
                    <p className="update-content">{update.content}</p>
                    <div className="update-footer">
                      <span>{update.posted_by}</span>
                      {isAdmin && (
                        <button
                          className="item-action-icon-btn danger"
                          title="Delete Announcement"
                          onClick={() => handleDeleteUpdate(update.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Recent Contributions Card */}
            <div className="recent-contributions-card">
              <h4 className="recent-contributions-title">Recent Contributions</h4>
              <p className="recent-contributions-subtitle">12 new contributions verified this week</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="contributions-avatars-row">
                  <div className="contributor-dot-avatar">RS</div>
                  <div className="contributor-dot-avatar">MN</div>
                  <div className="contributor-dot-avatar">AP</div>
                  <span className="more-flats-label">+9 more active flats</span>
                </div>
                <button
                  className="btn-contribute-primary"
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                  onClick={() => setIsDonationModalOpen(true)}
                >
                  Contribute
                </button>
              </div>
            </div>

            {/* 3. Resident Registration / RSVP Section */}
            <div className="section-panel-card">
              <div className="section-panel-header">
                <h3 className="section-panel-title">Participation & RSVP</h3>
                <button
                  className="section-panel-edit-trigger"
                  onClick={() => setIsPoojaModalOpen(true)}
                >
                  <Sparkles size={13} />
                  <span>Book Pooja Slot</span>
                </button>
              </div>

              {userRegistration ? (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1rem', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <CheckCircle2 size={18} color="#059669" />
                    <strong style={{ color: '#065f46', fontSize: '0.92rem' }}>You are Registered!</strong>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#047857', margin: '0 0 0.75rem' }}>
                    Participant: <strong>{userRegistration.participant_name}</strong> (Qty: {userRegistration.quantity})
                  </p>
                  <button
                    onClick={handleCancelRegistration}
                    disabled={submitting}
                    style={{
                      background: 'transparent',
                      border: '1px solid #fca5a5',
                      color: '#dc2626',
                      borderRadius: '6px',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    {submitting ? 'Cancelling...' : 'Cancel Registration'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegister}>
                  {householdMembers.length > 0 && (
                    <div style={{ marginBottom: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                        Who is attending?
                      </label>
                      <select
                        className="form-control-select"
                        value={selectedPersonType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedPersonType(val);
                          if (val === 'self') {
                            supabase.auth.getUser().then(({ data: { user } }) => {
                              if (user) {
                                supabase
                                  .from('profiles')
                                  .select('*')
                                  .eq('id', user.id)
                                  .single()
                                  .then(({ data: p }) => {
                                    if (p) {
                                      setParticipantName(p.full_name || '');
                                      setParticipantEmail(p.email || '');
                                      setParticipantMobile(p.mobile || '');
                                    }
                                  });
                              }
                            });
                          } else {
                            const member = householdMembers.find((m) => m.id === val);
                            if (member) {
                              setParticipantName(member.full_name || '');
                              setParticipantEmail(member.email || '');
                              setParticipantMobile(member.mobile || '');
                            }
                          }
                        }}
                      >
                        <option value="self">Myself (Primary Resident)</option>
                        {householdMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name} ({m.resident_type || m.relationship})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                      Participant Name *
                    </label>
                    <input
                      type="text"
                      className="form-control-input"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="Full Name"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                        Mobile
                      </label>
                      <input
                        type="tel"
                        className="form-control-input"
                        value={participantMobile}
                        onChange={(e) => setParticipantMobile(e.target.value)}
                        placeholder="10-digit mobile"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                        Attendees
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        className="form-control-input"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-contribute-primary"
                    disabled={submitting}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                  >
                    {submitting ? 'Confirming...' : 'Register / RSVP'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ADMIN EDIT MODALS ==================== */}

      {/* 1. Modal: Edit Header Details */}
      {isEditHeaderOpen && (
        <div className="event-modal-backdrop" onClick={() => setIsEditHeaderOpen(false)}>
          <div className="event-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="event-modal-header">
              <h3 className="event-modal-title">Edit Event Details</h3>
              <button className="event-modal-close" onClick={() => setIsEditHeaderOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveHeader}>
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  className="form-control-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="form-control-select"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as EventCategory)}
                  >
                    <option value="Festival">Festival</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Community">Community</option>
                    <option value="Religious">Religious</option>
                    <option value="Kids">Kids</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Meeting">Meeting</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Venue *</label>
                  <input
                    type="text"
                    className="form-control-input"
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    className="form-control-input"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    className="form-control-input"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    className="form-control-input"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    className="form-control-input"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Hero Banner Image URL</label>
                <input
                  type="url"
                  className="form-control-input"
                  placeholder="https://images.unsplash.com/... (direct .jpg / .png image link)"
                  value={editBannerUrl}
                  onChange={(e) => setEditBannerUrl(e.target.value)}
                />
                <span style={{ display: 'block', fontSize: '0.74rem', color: '#64748b', marginTop: '0.3rem', lineHeight: 1.4 }}>
                  💡 <strong>Tip:</strong> Paste a direct image link (e.g. ending in <code>.jpg</code>, <code>.png</code>, <code>.webp</code>, or from Unsplash). Do not paste blog article pages.
                </span>

                {/* Quick Festive Image Presets */}
                <div style={{ marginTop: '0.65rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Or Pick a Curated Festive Banner:
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setEditBannerUrl('https://images.unsplash.com/photo-1567591370504-20a2bf4762c3?q=80&w=1600&auto=format&fit=crop')}
                      style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 500 }}
                    >
                      🪔 Ganesh Utsav
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditBannerUrl('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop')}
                      style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 500 }}
                    >
                      🎆 Diwali & Festive
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditBannerUrl('https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop')}
                      style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 500 }}
                    >
                      🎭 Cultural & Arts
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditBannerUrl('https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=1600&auto=format&fit=crop')}
                      style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 500 }}
                    >
                      🏆 Sports Carnival
                    </button>
                  </div>
                </div>

                {/* Live Preview Box */}
                {editBannerUrl.trim() && (
                  <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', height: '110px', background: '#f1f5f9', position: 'relative' }}>
                    <img
                      src={editBannerUrl}
                      alt="Banner Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent && !parent.querySelector('.preview-error-msg')) {
                          const errDiv = document.createElement('div');
                          errDiv.className = 'preview-error-msg';
                          errDiv.style.padding = '0.75rem';
                          errDiv.style.color = '#dc2626';
                          errDiv.style.fontSize = '0.78rem';
                          errDiv.style.fontWeight = '600';
                          errDiv.innerText = '⚠️ Unable to load image. The URL appears to be a website/blog page rather than a direct image link.';
                          parent.appendChild(errDiv);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="form-actions-row">
                <button
                  type="button"
                  className="btn-secondary-modal"
                  onClick={() => setIsEditHeaderOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-modal" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Edit About Description */}
      {isEditAboutOpen && (
        <div className="event-modal-backdrop" onClick={() => setIsEditAboutOpen(false)}>
          <div className="event-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="event-modal-header">
              <h3 className="event-modal-title">Edit About This Event</h3>
              <button className="event-modal-close" onClick={() => setIsEditAboutOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveAbout}>
              <div className="form-group">
                <label>Event Description</label>
                <textarea
                  rows={6}
                  className="form-control-textarea"
                  value={editAboutText}
                  onChange={(e) => setEditAboutText(e.target.value)}
                  placeholder="Detailed background, festive plans, activities..."
                  required
                />
              </div>
              <div className="form-actions-row">
                <button
                  type="button"
                  className="btn-secondary-modal"
                  onClick={() => setIsEditAboutOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-modal" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Update Description'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Edit Funding Goals */}
      {isEditGoalsOpen && (
        <div className="event-modal-backdrop" onClick={() => setIsEditGoalsOpen(false)}>
          <div className="event-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="event-modal-header">
              <h3 className="event-modal-title">Edit Funding & Goals</h3>
              <button className="event-modal-close" onClick={() => setIsEditGoalsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveGoals}>
              <div className="form-group">
                <label>Target Budget Goal (₹)</label>
                <input
                  type="number"
                  className="form-control-input"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(Number(e.target.value))}
                  min={0}
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount Collected So Far (₹)</label>
                <input
                  type="number"
                  className="form-control-input"
                  value={goalCollected}
                  onChange={(e) => setGoalCollected(Number(e.target.value))}
                  min={0}
                  required
                />
              </div>
              <div className="form-group">
                <label>Total Contributors Count</label>
                <input
                  type="number"
                  className="form-control-input"
                  value={goalContributors}
                  onChange={(e) => setGoalContributors(Number(e.target.value))}
                  min={0}
                  required
                />
              </div>
              <div className="form-actions-row">
                <button
                  type="button"
                  className="btn-secondary-modal"
                  onClick={() => setIsEditGoalsOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-modal">
                  Save Goal Metrics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Add / Edit Schedule Item */}
      {isEditScheduleOpen && (
        <div className="event-modal-backdrop" onClick={() => setIsEditScheduleOpen(false)}>
          <div className="event-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="event-modal-header">
              <h3 className="event-modal-title">
                {scheduleToEdit ? 'Edit Schedule Item' : 'Add Schedule Item'}
              </h3>
              <button className="event-modal-close" onClick={() => setIsEditScheduleOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveScheduleItem}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Day Tag</label>
                  <input
                    type="text"
                    className="form-control-input"
                    value={formDayLabel}
                    onChange={(e) => setFormDayLabel(e.target.value)}
                    placeholder="Day 1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date & Time</label>
                  <input
                    type="text"
                    className="form-control-input"
                    value={formScheduleTime}
                    onChange={(e) => setFormScheduleTime(e.target.value)}
                    placeholder="Sep 5, 9:00 AM"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Program / Activity Title *</label>
                <input
                  type="text"
                  className="form-control-input"
                  value={formScheduleTitle}
                  onChange={(e) => setFormScheduleTitle(e.target.value)}
                  placeholder="e.g. Idol Installation & Sthapana"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description & Details</label>
                <textarea
                  rows={3}
                  className="form-control-textarea"
                  value={formScheduleDesc}
                  onChange={(e) => setFormScheduleDesc(e.target.value)}
                  placeholder="Morning ritual and collective community prayers."
                />
              </div>
              <div className="form-actions-row">
                <button
                  type="button"
                  className="btn-secondary-modal"
                  onClick={() => setIsEditScheduleOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-modal">
                  {scheduleToEdit ? 'Update Item' : 'Add to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Add / Edit Team Member */}
      {isEditTeamOpen && (
        <div className="event-modal-backdrop" onClick={() => setIsEditTeamOpen(false)}>
          <div className="event-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="event-modal-header">
              <h3 className="event-modal-title">
                {teamToEdit ? 'Edit Organizing Member' : 'Add Organizing Member'}
              </h3>
              <button className="event-modal-close" onClick={() => setIsEditTeamOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveTeamMember}>
              <div className="form-group">
                <label>Member Full Name *</label>
                <input
                  type="text"
                  className="form-control-input"
                  value={formMemberName}
                  onChange={(e) => setFormMemberName(e.target.value)}
                  placeholder="e.g. Amit Patel"
                  required
                />
              </div>
              <div className="form-group">
                <label>Role & Flat/Block</label>
                <input
                  type="text"
                  className="form-control-input"
                  value={formMemberRole}
                  onChange={(e) => setFormMemberRole(e.target.value)}
                  placeholder="e.g. Treasurer, Block A"
                />
              </div>
              <div className="form-group">
                <label>Key Responsibilities</label>
                <input
                  type="text"
                  className="form-control-input"
                  value={formMemberResp}
                  onChange={(e) => setFormMemberResp(e.target.value)}
                  placeholder="e.g. Handles finances & clearance tickets"
                />
              </div>
              <div className="form-group">
                <label>Avatar Photo URL (Optional)</label>
                <input
                  type="url"
                  className="form-control-input"
                  value={formMemberAvatar}
                  onChange={(e) => setFormMemberAvatar(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="form-actions-row">
                <button
                  type="button"
                  className="btn-secondary-modal"
                  onClick={() => setIsEditTeamOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-modal">
                  {teamToEdit ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Post Update / Bulletin */}
      {isPostUpdateOpen && (
        <div className="event-modal-backdrop" onClick={() => setIsPostUpdateOpen(false)}>
          <div className="event-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="event-modal-header">
              <h3 className="event-modal-title">Post Event Update</h3>
              <button className="event-modal-close" onClick={() => setIsPostUpdateOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePostUpdate}>
              <div className="form-group">
                <label>Update Title *</label>
                <input
                  type="text"
                  className="form-control-input"
                  value={formUpdateTitle}
                  onChange={(e) => setFormUpdateTitle(e.target.value)}
                  placeholder="e.g. Decoration Work Started"
                  required
                />
              </div>
              <div className="form-group">
                <label>Bulletin Content *</label>
                <textarea
                  rows={4}
                  className="form-control-textarea"
                  value={formUpdateContent}
                  onChange={(e) => setFormUpdateContent(e.target.value)}
                  placeholder="Catering and lighting setups have arrived. Volunteers needed for evening decorations."
                  required
                />
              </div>
              <div className="form-actions-row">
                <button
                  type="button"
                  className="btn-secondary-modal"
                  onClick={() => setIsPostUpdateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-modal">
                  Post Bulletin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Edit / Add Special Sponsor */}
      {isEditSponsorOpen && (
        <div className="event-modal-backdrop" onClick={() => setIsEditSponsorOpen(false)}>
          <div className="event-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="event-modal-header">
              <h3 className="event-modal-title">
                {sponsorToEdit ? 'Edit Special Sponsor' : 'Add Special Sponsor'}
              </h3>
              <button className="event-modal-close" onClick={() => setIsEditSponsorOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveSpecialSponsor}>
              <div className="form-group">
                <label>Sponsorship Seva Category *</label>
                <select
                  className="form-control-select"
                  value={formSponsorCategory}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setFormSponsorCategory(cat);
                    if (cat.includes('IDOL')) setFormSponsorIcon('idol');
                    else if (cat.includes('PUJARI')) setFormSponsorIcon('pujari');
                    else if (cat.includes('POOJA')) setFormSponsorIcon('pooja_item');
                    else if (cat.includes('DAILY')) setFormSponsorIcon('daily_prasadam');
                    else if (cat.includes('MAHA')) setFormSponsorIcon('mahaprasadam');
                    else if (cat.includes('LADDU')) setFormSponsorIcon('laddu');
                  }}
                >
                  <option value="IDOL SPONSOR">🪔 IDOL SPONSOR (Murti Seva)</option>
                  <option value="PUJARI SPONSOR">🔔 PUJARI SPONSOR (Vedic Priest)</option>
                  <option value="POOJA ITEM SPONSOR">🕯️ POOJA ITEM SPONSOR (Samagri / Flowers)</option>
                  <option value="DAILY PRASADAM SPONSOR">🍚 DAILY PRASADAM SPONSOR (Aarti Prasad)</option>
                  <option value="MAHAPRASADAM SPONSOR">🍲 MAHAPRASADAM SPONSOR (Community Feast)</option>
                  <option value="LADDU SPONSOR">🟡 LADDU SPONSOR (Maha Modak / Laddu)</option>
                  <option value="STAGE & DECOR SPONSOR">🎪 STAGE & DECOR SPONSOR</option>
                  <option value="LIGHTING & SOUND SPONSOR">💡 LIGHTING & SOUND SPONSOR</option>
                  <option value="SPECIAL SEVA PATRON">⭐ SPECIAL SEVA PATRON</option>
                </select>
              </div>

              <div className="form-group">
                <label>Sponsor Name *</label>
                <input
                  type="text"
                  className="form-control-input"
                  placeholder="e.g. Sanjay Banerjee"
                  value={formSponsorName}
                  onChange={(e) => setFormSponsorName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Flat / Tower Number *</label>
                <input
                  type="text"
                  className="form-control-input"
                  placeholder="e.g. Flat A-1711 or A1711"
                  value={formSponsorFlat}
                  onChange={(e) => setFormSponsorFlat(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Seva Tagline / Scope (Optional)</label>
                <input
                  type="text"
                  className="form-control-input"
                  placeholder="e.g. Main Altar Clay Murti Seva"
                  value={formSponsorTagline}
                  onChange={(e) => setFormSponsorTagline(e.target.value)}
                />
              </div>

              <div className="form-actions-row">
                <button
                  type="button"
                  className="btn-secondary-modal"
                  onClick={() => setIsEditSponsorOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-modal">
                  {sponsorToEdit ? 'Update Sponsor' : 'Add Sponsor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resident Contribution Modal */}
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        campaign={campaignItem}
        flatId={activeAccess[0]?.flat_id}
        onSuccess={() => {
          setIsDonationModalOpen(false);
          setActionSuccess('Thank you for contributing to this event!');
        }}
      />

      {/* Resident Pooja Slot Booking Modal */}
      <PoojaBookingModal
        isOpen={isPoojaModalOpen}
        onClose={() => setIsPoojaModalOpen(false)}
        flatId={activeAccess[0]?.flat_id}
        flatNumber={activeAccess[0]?.flat_number}
        onSuccess={() => {
          setIsPoojaModalOpen(false);
          setActionSuccess('Pooja slot booked successfully!');
        }}
      />
    </div>
  );
};
