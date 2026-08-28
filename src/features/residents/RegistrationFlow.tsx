import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Building2,
  Home,
  User,
  Mail,
  Phone,
  Calendar,
  Car,
  FileText,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Users,
  KeyRound,
  Building,
  UploadCloud,
  FileCheck,
  Paperclip,
  Plus,
  Trash2,
  X,
  Cake,
  HeartHandshake,
  UserPlus,
  Edit2,
  Info,
} from 'lucide-react';
import {
  searchFlats,
  getBlocks,
  submitRegistration,
  getCommunitySummary,
  uploadRentalAgreementFile,
  uploadParkingDocumentFile,
} from '../../services/supabase/registrationService';
import type {
  FlatSearchResult,
  BlockInfo,
  CommunitySummary,
  VehicleEntry,
  FamilyMemberEntry,
} from '../../services/supabase/registrationService';
import { supabase } from '../../services/supabase/client';
import './RegistrationFlow.css';

interface LocationState {
  prefilledFlatId?: string;
  prefilledFlatNumber?: string;
  prefilledBlock?: string;
}

type OccupancyOption =
  | 'Yes, I live here'
  | 'No, my family lives here'
  | 'No, the flat is rented'
  | 'No, the flat is currently vacant';

interface CommunityResidentPreview {
  id: string;
  full_name: string;
  photo_url?: string | null;
  flat_number?: string;
}

export const RegistrationFlow: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Flat & Occupancy State
  const [flatQuery, setFlatQuery] = useState(state?.prefilledFlatNumber || '');
  const [selectedFlat, setSelectedFlat] = useState<FlatSearchResult | null>(null);
  const [flatResults, setFlatResults] = useState<FlatSearchResult[]>([]);
  const [showFlatDropdown, setShowFlatDropdown] = useState(false);
  const [isSearchingFlat, setIsSearchingFlat] = useState(false);
  const [occupancyStatus, setOccupancyStatus] = useState<OccupancyOption>('Yes, I live here');

  // Step 2 - Section 1: Owner Personal Info State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dobMonthYear, setDobMonthYear] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [residentSince, setResidentSince] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  // Step 2 - Section 2: Family Members State & Modal Popup
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberEntry[]>([]);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isFamilyInfoModalOpen, setIsFamilyInfoModalOpen] = useState(false);
  const [editingFamilyIndex, setEditingFamilyIndex] = useState<number | null>(null);
  const [famName, setFamName] = useState('');
  const [famRelation, setFamRelation] = useState('Spouse');
  const [famDob, setFamDob] = useState('');
  const [famMobile, setFamMobile] = useState('');
  const [famEmail, setFamEmail] = useState('');
  const [famBloodGroup, setFamBloodGroup] = useState('');
  const [famModalError, setFamModalError] = useState<string | null>(null);

  // Step 2 - Section 3: Structured Parking & Vehicle Details State & Modal Popup
  const [vehicles, setVehicles] = useState<VehicleEntry[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicleIndex, setEditingVehicleIndex] = useState<number | null>(null);
  const [vehSlot, setVehSlot] = useState('');
  const [vehType, setVehType] = useState('4W (Car)');
  const [vehMakeModel, setVehMakeModel] = useState('');
  const [vehRegNumber, setVehRegNumber] = useState('');
  const [vehColour, setVehColour] = useState('');
  const [vehRemarks, setVehRemarks] = useState('');
  const [vehModalError, setVehModalError] = useState<string | null>(null);
  const [parkingDocFile, setParkingDocFile] = useState<File | null>(null);
  const [parkingDocUrl, setParkingDocUrl] = useState<string>('');
  const [isUploadingParkingDoc, setIsUploadingParkingDoc] = useState(false);

  // Step 3 (If Rented): Tenant Verification & Lease Agreement State
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantMobile, setTenantMobile] = useState('');
  const [leaseStartDate, setLeaseStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [rentalAgreementFile, setRentalAgreementFile] = useState<File | null>(null);
  const [rentalAgreementUrl, setRentalAgreementUrl] = useState<string>('');
  const [isUploadingRentalDoc, setIsUploadingRentalDoc] = useState(false);

  // Final Step: Bylaws Agreement
  const [agreedToRules, setAgreedToRules] = useState(false);

  // Data Loading & Community Proof State
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [communitySummary, setCommunitySummary] = useState<CommunitySummary | null>(null);
  const [communityResidents, setCommunityResidents] = useState<CommunityResidentPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessingOAuthReturn, setIsProcessingOAuthReturn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatSearchRef = useRef<HTMLDivElement>(null);
  const parkingFileInputRef = useRef<HTMLInputElement>(null);
  const rentalFileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRented = occupancyStatus === 'No, the flat is rented';
  const isFamilyLiving = occupancyStatus === 'No, my family lives here';
  const isOwnerLiving = occupancyStatus === 'Yes, I live here';
  const totalSteps = isRented ? 4 : 3;
  const finalConfirmationStep = isRented ? 4 : 3;

  // Calculate age from Month & Year (YYYY-MM)
  const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const parts = dobString.split('-');
    if (parts.length < 2) return null;
    const birthYear = parseInt(parts[0], 10);
    const birthMonth = parseInt(parts[1], 10);
    if (isNaN(birthYear) || isNaN(birthMonth)) return null;

    const now = new Date();
    let age = now.getFullYear() - birthYear;
    if (now.getMonth() + 1 < birthMonth) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const calculatedOwnerAge = calculateAge(dobMonthYear);
  const calculatedFamAge = calculateAge(famDob);

  // Fetch Community Summary, Residents & Blocks on mount
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [blocksData, summaryData] = await Promise.all([
          getBlocks().catch(() => []),
          getCommunitySummary().catch(() => null),
        ]);
        setBlocks(blocksData);
        setCommunitySummary(summaryData);

        const { data: residentProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, photo_url')
          .not('full_name', 'is', null)
          .limit(4);

        if (residentProfiles && residentProfiles.length > 0) {
          setCommunityResidents(residentProfiles);
        }
      } catch (err) {
        console.warn('Initial data load error:', err);
      }
    }
    fetchInitialData();
  }, []);

  // Handle prefilled flat from location state if passed from login
  useEffect(() => {
    async function initPrefilled() {
      if (state?.prefilledFlatNumber) {
        setFlatQuery(state.prefilledFlatNumber);
        try {
          const results = await searchFlats(state.prefilledFlatNumber);
          const matched = results.find(
            (f) => f.flat_number.toLowerCase() === state.prefilledFlatNumber?.toLowerCase()
          );
          if (matched) {
            setSelectedFlat(matched);
          }
        } catch (e) {
          console.error('Error matching prefilled flat:', e);
        }
      }

      // Check if user is returning from Google OAuth redirect with pending registration payload
      try {
        const pendingPayloadStr = sessionStorage.getItem('pending_registration_payload');
        const { data: { user } } = await supabase.auth.getUser();

        if (user && pendingPayloadStr) {
          setIsProcessingOAuthReturn(true);
          const payload = JSON.parse(pendingPayloadStr);
          sessionStorage.removeItem('pending_registration_payload');

          try {
            await supabase.from('profiles').upsert({
              id: user.id,
              full_name: payload.full_name || user.user_metadata?.full_name || 'Resident',
              email: user.email,
              mobile_number: payload.mobile_number || undefined,
            });

            if (payload.flat_id) {
              await submitRegistration({
                flat_id: payload.flat_id,
                block_id: payload.block_id,
                requested_membership_type: 'Primary Resident',
                relationship: 'Self',
                occupancy_status: payload.occupancy_status || 'Self Occupied',
                mobile: payload.mobile_number,
                resident_type: 'Owner',
                resident_since: payload.resident_since || undefined,
                dob_month_year: payload.dob_month_year || undefined,
                age: payload.age || undefined,
                blood_group: payload.blood_group || undefined,
                family_members: payload.family_members || undefined,
                parking_details: payload.parking_details || undefined,
                parking_document_url: payload.parking_document_url || undefined,
                vehicles: payload.vehicles || undefined,
                remarks: payload.remarks || `Applicant: ${payload.full_name || user.email}`,
                tenant_name: payload.tenant_name || undefined,
                tenant_email: payload.tenant_email || undefined,
                tenant_mobile: payload.tenant_mobile || undefined,
                lease_start_date: payload.lease_start_date || undefined,
                lease_end_date: payload.lease_end_date || undefined,
                rental_agreement_url: payload.rental_agreement_url || undefined,
              });
            }

            navigate('/registration-status');
          } catch (oauthErr) {
            console.error('Error completing OAuth registration:', oauthErr);
            setIsProcessingOAuthReturn(false);
          }
        }
      } catch (err) {
        console.warn('Init error:', err);
      }
    }
    initPrefilled();
  }, [state, navigate]);

  // Handle flat search with debounce against Supabase search_flats RPC
  const handleFlatSearchChange = (query: string) => {
    setFlatQuery(query);
    setSelectedFlat(null);
    setError(null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.trim().length === 0) {
      setFlatResults([]);
      setShowFlatDropdown(false);
      return;
    }

    setIsSearchingFlat(true);
    setShowFlatDropdown(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchFlats(query.trim());
        setFlatResults(results);
      } catch (err) {
        console.error('Flat search error:', err);
      } finally {
        setIsSearchingFlat(false);
      }
    }, 250);
  };

  const handleSelectFlat = (flat: FlatSearchResult) => {
    setSelectedFlat(flat);
    setFlatQuery(flat.flat_number);
    setShowFlatDropdown(false);
    setError(null);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (flatSearchRef.current && !flatSearchRef.current.contains(e.target as Node)) {
        setShowFlatDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Family Modal Handlers
  const handleOpenAddFamilyModal = () => {
    setEditingFamilyIndex(null);
    setFamName('');
    setFamRelation('Spouse');
    setFamDob('');
    setFamMobile('');
    setFamEmail('');
    setFamBloodGroup('');
    setFamModalError(null);
    setIsFamilyModalOpen(true);
  };

  const handleOpenEditFamilyModal = (index: number) => {
    const member = familyMembers[index];
    setEditingFamilyIndex(index);
    setFamName(member.full_name);
    setFamRelation(member.relationship);
    setFamDob(member.dob_month_year || '');
    setFamMobile(member.mobile || '');
    setFamEmail(member.email || '');
    setFamBloodGroup(member.blood_group || '');
    setFamModalError(null);
    setIsFamilyModalOpen(true);
  };

  const handleSaveFamilyMember = () => {
    if (!famName.trim()) {
      setFamModalError('Please enter family member full name.');
      return;
    }

    const memberEntry: FamilyMemberEntry = {
      full_name: famName.trim(),
      relationship: famRelation,
      dob_month_year: famDob || undefined,
      age: calculatedFamAge !== null ? calculatedFamAge : undefined,
      mobile: famMobile.trim() || undefined,
      email: famEmail.trim().toLowerCase() || undefined,
      blood_group: famBloodGroup || undefined,
    };

    if (editingFamilyIndex !== null) {
      const updated = [...familyMembers];
      updated[editingFamilyIndex] = memberEntry;
      setFamilyMembers(updated);
    } else {
      setFamilyMembers([...familyMembers, memberEntry]);
    }

    setIsFamilyModalOpen(false);
  };

  const handleRemoveFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  // Vehicle Modal Handlers
  const handleOpenAddVehicleModal = () => {
    setEditingVehicleIndex(null);
    setVehSlot('');
    setVehType('4W (Car)');
    setVehMakeModel('');
    setVehRegNumber('');
    setVehColour('');
    setVehRemarks('');
    setVehModalError(null);
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicleModal = (index: number) => {
    const v = vehicles[index];
    setEditingVehicleIndex(index);
    setVehSlot(v.slot_number || '');
    setVehType(v.vehicle_type || '4W (Car)');
    setVehMakeModel(v.make_model || '');
    setVehRegNumber(v.reg_number || '');
    setVehColour(v.colour || '');
    setVehRemarks(v.remarks || '');
    setVehModalError(null);
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = () => {
    if (!vehSlot.trim() && !vehRegNumber.trim() && !vehMakeModel.trim()) {
      setVehModalError('Please enter at least Parking Slot Number, Registration Number, or Vehicle Model.');
      return;
    }

    const vehicleEntry: VehicleEntry = {
      slot_number: vehSlot.trim(),
      vehicle_type: vehType,
      make_model: vehMakeModel.trim(),
      reg_number: vehRegNumber.trim().toUpperCase(),
      colour: vehColour.trim(),
      remarks: vehRemarks.trim(),
    };

    if (editingVehicleIndex !== null) {
      const updated = [...vehicles];
      updated[editingVehicleIndex] = vehicleEntry;
      setVehicles(updated);
    } else {
      setVehicles([...vehicles, vehicleEntry]);
    }

    setIsVehicleModalOpen(false);
  };

  const handleRemoveVehicle = (index: number) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  // Handle Parking Document File Selection
  const handleParkingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('Parking document file size must be less than 15MB.');
      return;
    }

    setParkingDocFile(file);
    setError(null);

    try {
      setIsUploadingParkingDoc(true);
      const url = await uploadParkingDocumentFile(file, selectedFlat?.flat_number || 'flat');
      setParkingDocUrl(url);
    } catch (uploadErr: any) {
      console.warn('Parking document upload error:', uploadErr);
      setError('Could not upload parking document. Please retry or choose another format.');
    } finally {
      setIsUploadingParkingDoc(false);
    }
  };

  // Handle Rental Agreement File Selection
  const handleRentalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('Rental agreement file size must be less than 15MB.');
      return;
    }

    setRentalAgreementFile(file);
    setError(null);

    try {
      setIsUploadingRentalDoc(true);
      const url = await uploadRentalAgreementFile(file, selectedFlat?.flat_number || 'flat');
      setRentalAgreementUrl(url);
    } catch (uploadErr: any) {
      console.warn('Rental agreement upload error:', uploadErr);
      setError('Could not upload agreement document. Please retry or choose another format.');
    } finally {
      setIsUploadingRentalDoc(false);
    }
  };

  // Step 1 Validation & Proceed to Step 2
  const handleNextToStep2 = () => {
    setError(null);
    if (!selectedFlat && !flatQuery.trim()) {
      setError('Please search and select your Flat / Apartment Number.');
      return;
    }
    if (selectedFlat?.owner_registered) {
      setError('This flat is already registered. If any mismatch, please contact bpstwintowers.society@gmail.com');
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation & Proceed to Step 3 (Tenant if Rented, or Confirm if Not Rented)
  const handleNextToStep3 = () => {
    setError(null);
    if (!fullName.trim()) {
      setError('Please enter your full name as the Flat Owner.');
      return;
    }

    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed) {
      setError('Please enter your Gmail address.');
      return;
    }
    if (!emailTrimmed.endsWith('@gmail.com') && !emailTrimmed.endsWith('@googlemail.com')) {
      setError('Email Address must be a valid Gmail ID (e.g. yourname@gmail.com) for Google authentication.');
      return;
    }

    if (!mobileNumber.trim()) {
      setError('Please enter your WhatsApp mobile number.');
      return;
    }

    // If owner selected "No, my family lives here", enforce at least 1 family member
    if (isFamilyLiving && familyMembers.length === 0) {
      setError('Please add at least one residing family member since you selected "No, my family lives here". Click "+ Add Member" in the Family section.');
      return;
    }

    setCurrentStep(3);
  };

  // Step 3 (If Rented) Validation & Proceed to Step 4 (Confirm)
  const handleNextToStep4 = () => {
    setError(null);
    if (!tenantName.trim()) {
      setError('Please enter the Primary Tenant Full Name.');
      return;
    }
    if (!tenantMobile.trim()) {
      setError('Please enter the Tenant Mobile Number.');
      return;
    }
    if (!rentalAgreementUrl && !rentalAgreementFile) {
      setError('Please upload the Rental Agreement document (PDF / Image) for tenant verification.');
      return;
    }
    setCurrentStep(4);
  };

  // Final Submit via Google OAuth
  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedFlat?.owner_registered) {
      setError('This flat is already registered with an active owner on record. If any mismatch, please contact bpstwintowers.society@gmail.com');
      return;
    }

    if (!agreedToRules) {
      setError('Please certify ownership/residency and agree to the society bylaws to proceed.');
      return;
    }

    try {
      setLoading(true);

      let targetFlatId = selectedFlat?.flat_id;
      if (!targetFlatId && flatQuery.trim()) {
        const matched = await searchFlats(flatQuery.trim());
        const exact = matched.find(
          (f) => f.flat_number.toLowerCase() === flatQuery.trim().toLowerCase()
        );
        if (exact) {
          targetFlatId = exact.flat_id;
        }
      }

      if (!targetFlatId) {
        setError('Could not verify selected flat in society database. Please select from search dropdown.');
        setLoading(false);
        return;
      }

      // Filter valid vehicle rows
      const validVehicles = vehicles.filter(
        (v) => v.slot_number.trim() || v.reg_number.trim() || v.make_model.trim()
      );

      // Create human readable parking summary string
      const formattedParkingDetails = validVehicles.length > 0
        ? validVehicles.map((v, i) => `[${i + 1}] Slot: ${v.slot_number || 'N/A'}, ${v.vehicle_type}, ${v.make_model || ''} (${v.reg_number || ''}) - ${v.colour || ''}`).join('; ')
        : undefined;

      // Derive block_id
      const blockLetter = flatQuery.trim().toUpperCase().startsWith('B') ? 'Block B' : 'Block A';
      const matchedBlock = blocks.find((b) => b.name === blockLetter);

      // Save registration state to sessionStorage for retrieval after Google OAuth redirect
      const registrationPayload = {
        flat_id: targetFlatId,
        block_id: matchedBlock?.id || undefined,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobile_number: mobileNumber.trim(),
        block: blockLetter,
        occupancy_status: occupancyStatus,
        resident_since: residentSince || undefined,
        dob_month_year: dobMonthYear || undefined,
        age: calculatedOwnerAge || undefined,
        blood_group: bloodGroup || undefined,
        family_members: familyMembers.length > 0 ? familyMembers : undefined,
        parking_details: formattedParkingDetails,
        parking_document_url: parkingDocUrl || undefined,
        vehicles: validVehicles.length > 0 ? validVehicles : undefined,
        remarks: remarks.trim() || undefined,
        tenant_name: isRented ? tenantName.trim() : undefined,
        tenant_email: isRented ? tenantEmail.trim().toLowerCase() : undefined,
        tenant_mobile: isRented ? tenantMobile.trim() : undefined,
        lease_start_date: isRented ? leaseStartDate : undefined,
        lease_end_date: isRented ? leaseEndDate : undefined,
        rental_agreement_url: isRented ? rentalAgreementUrl || undefined : undefined,
      };

      sessionStorage.setItem(
        'pending_registration_payload',
        JSON.stringify(registrationPayload)
      );

      // Trigger Fast Google OAuth Flow with login_hint
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {\n          redirectTo: `${window.location.origin}/register`,
          queryParams: {
            login_hint: email.trim().toLowerCase(),
          },
        },
      });

      if (authError) throw authError;
    } catch (err: any) {
      console.error('Registration submit error:', err);
      setError(err.message || 'Failed to initialize Google authentication. Please try again.');
      setLoading(false);
    }
  };

  const totalResidentsCount = communitySummary?.active_residents_count || 240;

  return (
    <div className="register-root-container">
      {/* Full-Screen Fast Authentication Overlay */}
      {(loading || isProcessingOAuthReturn) && (
        <div className="oauth-redirect-loading-overlay animate-fade-in">
          <div className="oauth-redirect-card animate-scale-in">
            <div className="oauth-spinner-ring" />
            <div className="oauth-redirect-icon-wrap">
              <svg width=\"26\" height=\"26\" viewBox=\"0 0 24 24\">
                <path
                  fill=\"#4285F4\"
                  d=\"M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z\"
                />
                <path
                  fill=\"#34A853\"
                  d=\"M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z\"
                />
                <path
                  fill=\"#FBBC05\"
                  d=\"M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z\"
                />
                <path
                  fill=\"#EA4335\"
                  d=\"M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z\"
                />
              </svg>
            </div>
            <h3 className=\"oauth-redirect-title\">
              {isProcessingOAuthReturn ? 'Finalizing Registration...' : 'Connecting to Google...'}
            </h3>
            <p className=\"oauth-redirect-desc\">
              {isProcessingOAuthReturn
                ? 'Saving your verified flat ownership and setting up your resident profile.'
                : `Redirecting to Google Secure Authentication for ${email || 'your account'}.`}
            </p>
            <span className=\"oauth-redirect-sub\">Please hold on for a moment...</span>
          </div>
        </div>
      )}

      {/* ====================================================================
          LEFT HERO PANEL (Consistent Luxury Showcase Matching Login Page)
          ==================================================================== */}
      <div className=\"left-hero-panel\">
        <div className=\"hero-background-media\" />
        <div className=\"hero-gradient-overlay\" />

        <div className=\"hero-content-wrapper\">
          {/* Header Brand */}
          <div className=\"hero-brand-header\">
            <div className=\"brand-logo-badge\">
              <img
                src=\"/logo.png\"
                alt=\"BPS Twin Towers Logo\"
                className=\"brand-logo-img\"
              />
            </div>
            <div className=\"brand-text-block\">
              <span className=\"brand-super-title\">Saidabad • Hyderabad</span>
              <h1 className=\"brand-name-title\">BPS TWIN TOWERS</h1>
            </div>
          </div>

          {/* Center Callout */}
          <div className=\"hero-bottom-group\">
            <div className=\"hero-center-callout\">
              <div className=\"gold-accent-bar\" />
              <div className=\"hero-welcome-badge\">
                <Sparkles size={13} className=\"gold-sparkle-icon\" />
                <span>Verified Resident Onboarding</span>
              </div>
              <h2 className=\"hero-luxury-headline\">
                Your community.
                <br />
                Your home.
                <br />
                Connected.
              </h2>
              <p className=\"hero-luxury-subtext\">
                Register your flat ownership securely to access digital maintenance, smart visitor approvals, facility reservations, and community notices.
              </p>
            </div>

            {/* Social Proof & Trust Counter */}
            <div className=\"hero-bottom-proof\">
              <div className=\"proof-left-group\">
                <div className=\"avatar-overlap-stack\">
                  {communityResidents.length > 0 ? (
                    communityResidents.slice(0, 4).map((r, i) =>
                      r.photo_url ? (
                        <img
                          key={r.id || i}
                          src={r.photo_url}
                          alt={r.full_name}
                          className=\"stack-avatar\"
                        />
                      ) : (
                        <div
                          key={r.id || i}
                          className=\"stack-avatar-initial\"
                          style={{
                            backgroundColor: i % 2 === 0 ? '#00685f' : '#0284c7',
                          }}
                        >
                          {r.full_name ? r.full_name.charAt(0).toUpperCase() : 'R'}
                        </div>
                      )
                    )
                  ) : (
                    <>
                      <div className=\"stack-avatar-initial\" style={{ backgroundColor: '#00685f' }}>R</div>
                      <div className=\"stack-avatar-initial\" style={{ backgroundColor: '#0284c7' }}>M</div>
                      <div className=\"stack-avatar-initial\" style={{ backgroundColor: '#0d9488' }}>S</div>
                    </>
                  )}
                </div>
                <div className=\"proof-text-group\">
                  <span className=\"proof-highlight\">{totalResidentsCount} Registered Residents</span>
                  <span className=\"proof-sub\">Tower A & Tower B</span>
                </div>
              </div>

              {/* Social Action Links */}
              <div className=\"hero-social-edge-links\">
                <a
                  href=\"mailto:bpstwintowers.society@gmail.com\"
                  className=\"social-edge-btn\"
                  title=\"Contact Support\"
                >
                  <Mail size={16} />
                </a>
                <a
                  href=\"https://instagram.com\"
                  target=\"_blank\"
                  rel=\"noreferrer\"
                  className=\"social-edge-btn\"
                  title=\"Instagram\"
                >
                  <svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\">
                    <rect x=\"2\" y=\"2\" width=\"20\" height=\"20\" rx=\"5\" ry=\"5\" />
                    <path d=\"M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z\" />
                    <line x1=\"17.5\" y1=\"6.5\" x2=\"17.51\" y2=\"6.5\" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          RIGHT REGISTRATION WORKSPACE (Section-Wise Clean Wizard)
          ==================================================================== */}
      <div className=\"right-register-panel\">
        <div className=\"register-card-wrapper animate-fade-in\">
          {/* Header */}
          <div className=\"register-header\">
            <h2 className=\"register-title\">Welcome to Your Home</h2>
            <p className=\"register-subtitle\">Complete your flat registration in {totalSteps} easy steps.</p>
          </div>

          {/* Wizard Step Progress Tracker */}
          <div className=\"wizard-step-tracker\">
            {/* Step 1: Flat */}
            <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className=\"step-badge\">{currentStep > 1 ? <CheckCircle2 size={15} /> : <span>1</span>}</div>
              <span className=\"step-name\">Flat</span>
            </div>
            <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`} />

            {/* Step 2: Owner, Family & Parking */}
            <div className={`step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className=\"step-badge\">{currentStep > 2 ? <CheckCircle2 size={15} /> : <span>2</span>}</div>
              <span className=\"step-name\">Owner & Details</span>
            </div>
            <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`} />

            {/* Step 3 (If Rented): Tenant */}
            {isRented && (
              <>
                <div className={`step-item ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
                  <div className=\"step-badge\">{currentStep > 3 ? <CheckCircle2 size={15} /> : <span>3</span>}</div>
                  <span className=\"step-name\">Tenant</span>
                </div>
                <div className={`step-line ${currentStep >= 4 ? 'active' : ''}`} />
              </>
            )}

            {/* Final Step: Confirm */}
            <div className={`step-item ${currentStep === finalConfirmationStep ? 'active' : ''}`}>
              <div className=\"step-badge\"><span>{finalConfirmationStep}</span></div>
              <span className=\"step-name\">Confirm</span>
            </div>
          </div>

          {error && (
            <div className=\"register-error-alert animate-fade-in\">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: FLAT SELECTION & OCCUPANCY STATUS */}
          {currentStep === 1 && (
            <div className=\"wizard-step-content animate-fade-in\">
              <div className=\"form-group-full\">
                <label className=\"reg-label\">Select Your Flat / Apartment Number</label>

                {selectedFlat ? (
                  selectedFlat.owner_registered ? (
                    <div className=\"selected-flat-card registered-conflict animate-fade-in\">
                      <div className=\"selected-flat-header-row\">
                        <div className=\"selected-flat-left\">
                          <div className=\"selected-flat-icon-badge conflict\">
                            <AlertCircle size={22} className=\"selected-flat-icon\" />
                          </div>
                          <div className=\"selected-flat-info\">
                            <div className=\"selected-flat-title-row\">
                              <span className=\"selected-flat-num\">{selectedFlat.flat_number}</span>
                              {selectedFlat.bhk && <span className=\"selected-flat-bhk\">{selectedFlat.bhk}</span>}
                              <span className=\"selected-flat-conflict-tag\">Already Registered</span>
                            </div>
                            <span className=\"selected-flat-tower-name\">
                              {selectedFlat.flat_number.toUpperCase().startsWith('B-') ? 'Tower B (Block B)' : 'Tower A (Block A)'} • Active Owner on Record
                            </span>
                          </div>
                        </div>
                        <button
                          type=\"button\"
                          className=\"btn-change-flat\"
                          onClick={() => {
                            setSelectedFlat(null);
                            setFlatQuery('');
                            setError(null);
                          }}
                        >
                          Change
                        </button>
                      </div>

                      <div className=\"flat-conflict-banner\">
                        <p className=\"conflict-text\">
                          This flat is already registered. If any mismatch or ownership transfer, please contact society administration:
                        </p>
                        <a
                          href={`mailto:bpstwintowers.society@gmail.com?subject=Flat%20${selectedFlat.flat_number}%20Registration%20Mismatch`}
                          className=\"btn-conflict-contact\"
                        >
                          <Mail size={16} />
                          <span>bpstwintowers.society@gmail.com</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className=\"selected-flat-card animate-fade-in\">
                      <div className=\"selected-flat-header-row\">
                        <div className=\"selected-flat-left\">
                          <div className=\"selected-flat-icon-badge\">
                            <Building2 size={22} className=\"selected-flat-icon\" />
                          </div>
                          <div className=\"selected-flat-info\">
                            <div className=\"selected-flat-title-row\">
                              <span className=\"selected-flat-num\">{selectedFlat.flat_number}</span>
                              {selectedFlat.bhk && <span className=\"selected-flat-bhk\">{selectedFlat.bhk}</span>}
                              <span className=\"selected-flat-verified-tag\">✓ Available to Register</span>
                            </div>
                            <span className=\"selected-flat-tower-name\">
                              {selectedFlat.flat_number.toUpperCase().startsWith('B-') ? 'Tower B (Block B)' : 'Tower A (Block A)'} • BPS Twin Towers
                            </span>
                          </div>
                        </div>
                        <button
                          type=\"button\"
                          className=\"btn-change-flat\"
                          onClick={() => {
                            setSelectedFlat(null);
                            setFlatQuery('');
                            setError(null);
                          }}
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className=\"flat-search-autocomplete-container\" ref={flatSearchRef}>
                    <div className=\"reg-input-wrapper\">
                      <Home size={18} className=\"reg-input-icon\" />
                      <input
                        id=\"reg-flat\"
                        type=\"text\"
                        placeholder=\"Search flat (e.g. A-402, B-811)...\"
                        className=\"reg-text-input reg-flat-hero-input\"
                        value={flatQuery}
                        onChange={(e) => handleFlatSearchChange(e.target.value)}
                        onFocus={() => {
                          if (flatResults.length > 0) setShowFlatDropdown(true);
                        }}
                        autoComplete=\"off\"
                        autoFocus
                      />
                      {isSearchingFlat && (
                        <span style={{ position: 'absolute', right: '12px', fontSize: '0.75rem', color: '#00685f', fontWeight: 600 }}>
                          Searching...
                        </span>
                      )}

                      {showFlatDropdown && flatResults.length > 0 && (\n                        <div className=\"flat-autocomplete-dropdown animate-fade-in\">
                          {flatResults.map((flat) => (
                            <button
                              key={flat.flat_id}
                              type=\"button\"
                              className=\"flat-autocomplete-item\"
                              onClick={() => handleSelectFlat(flat)}
                            >
                              <div className=\"flat-item-main\">
                                <span className=\"flat-item-number\">{flat.flat_number}</span>
                                {flat.bhk && <span className=\"flat-item-bhk\">{flat.bhk}</span>}
                              </div>
                              {flat.owner_registered ? (
                                <span className=\"badge-registered\">Owner Registered</span>
                              ) : (
                                <span className=\"badge-available\">Available to Register</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Occupancy Status Question */}
              <div className=\"form-group-full\" style={{ marginTop: '12px' }}>
                <label className=\"reg-label\">Are you currently staying in this flat?</label>
                <div className=\"occupancy-options-grid\">
                  <button
                    type=\"button\"
                    className={`occupancy-option-card ${occupancyStatus === 'Yes, I live here' ? 'selected' : ''}`}
                    onClick={() => setOccupancyStatus('Yes, I live here')}
                  >
                    <div className=\"occupancy-card-header\">
                      <div className=\"occupancy-icon-wrap\">
                        <Home size={18} />
                      </div>
                      <span className=\"occupancy-title\">Yes, I live here</span>
                    </div>
                    <p className=\"occupancy-desc\">Primary resident & staying in this flat</p>
                  </button>

                  <button
                    type=\"button\"
                    className={`occupancy-option-card ${occupancyStatus === 'No, my family lives here' ? 'selected' : ''}`}
                    onClick={() => setOccupancyStatus('No, my family lives here')}
                  >
                    <div className=\"occupancy-card-header\">
                      <div className=\"occupancy-icon-wrap\">
                        <Users size={18} />
                      </div>
                      <span className=\"occupancy-title\">No, my family lives here</span>
                    </div>
                    <p className=\"occupancy-desc\">Owner living elsewhere, family resides</p>
                  </button>

                  <button
                    type=\"button\"
                    className={`occupancy-option-card ${occupancyStatus === 'No, the flat is rented' ? 'selected' : ''}`}
                    onClick={() => setOccupancyStatus('No, the flat is rented')}
                  >
                    <div className=\"occupancy-card-header\">
                      <div className=\"occupancy-icon-wrap\">
                        <KeyRound size={18} />
                      </div>
                      <span className=\"occupancy-title\">No, the flat is rented</span>
                    </div>
                    <p className=\"occupancy-desc\">Living elsewhere, leased out to tenant</p>
                  </button>

                  <button
                    type=\"button\"
                    className={`occupancy-option-card ${occupancyStatus === 'No, the flat is currently vacant' ? 'selected' : ''}`}
                    onClick={() => setOccupancyStatus('No, the flat is currently vacant')}
                  >
                    <div className=\"occupancy-card-header\">
                      <div className=\"occupancy-icon-wrap\">
                        <Building size={18} />
                      </div>
                      <span className=\"occupancy-title\">No, the flat is currently vacant</span>
                    </div>
                    <p className=\"occupancy-desc\">Locked or currently unoccupied</p>
                  </button>
                </div>
              </div>

              {/* Step 1 Actions */}
              <div className=\"wizard-action-row\">
                <button
                  type=\"button\"
                  className=\"btn-wizard-next\"
                  onClick={handleNextToStep2}
                  disabled={!selectedFlat || selectedFlat.owner_registered}
                >
                  <span>Continue to Owner Details</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SECTION-WISE OWNER DETAILS, FAMILY MEMBERS & PARKING DETAILS */}
          {currentStep === 2 && (
            <div className=\"wizard-step-content animate-fade-in\">
              {/* Owner Role Notice */}
              <div className=\"owner-role-card\" style={{ marginBottom: '4px' }}>
                <div className=\"owner-role-badge\">
                  <ShieldCheck size={20} className=\"owner-role-icon\" />
                  <div className=\"owner-role-text\">
                    <span className=\"owner-role-title\">Flat Owner Registration</span>
                    <p className=\"owner-role-hint\">
                      Registering as Flat Owner for <strong>{selectedFlat?.flat_number}</strong> ({occupancyStatus}).
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION A: OWNER PERSONAL DETAILS */}
              <div className=\"form-sub-section-card animate-fade-in\">
                <div className=\"sub-section-header\">
                  <User size={18} className=\"sub-section-icon\" />
                  <div className=\"sub-section-title-wrap\">
                    <span className=\"sub-section-title\">1. Owner Details</span>
                    <span className=\"sub-section-subtitle\">Primary flat owner profile and contact information</span>
                  </div>
                </div>

                {/* Full Name */}
                <div className=\"form-group-full\">
                  <label htmlFor=\"reg-full-name\" className=\"reg-label\">Owner Full Name *</label>
                  <div className=\"reg-input-wrapper\">
                    <User size={18} className=\"reg-input-icon\" />
                    <input
                      id=\"reg-full-name\"
                      type=\"text\"
                      placeholder=\"e.g. Ramesh Kumar\"
                      className=\"reg-text-input\"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Gmail & WhatsApp Mobile Grid */}
                <div className=\"form-grid-2col\">
                  <div className=\"form-group-col\">
                    <label htmlFor=\"reg-email\" className=\"reg-label\">Gmail ID (Google Auth) *</label>
                    <div className=\"reg-input-wrapper\">
                      <Mail size={18} className=\"reg-input-icon\" />
                      <input
                        id=\"reg-email\"
                        type=\"email\"
                        placeholder=\"yourname@gmail.com\"
                        className=\"reg-text-input\"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className=\"form-group-col\">
                    <label htmlFor=\"reg-mobile\" className=\"reg-label\">WhatsApp Mobile Number *</label>
                    <div className=\"reg-input-wrapper\">
                      <Phone size={18} className=\"reg-input-icon\" />
                      <input
                        id=\"reg-mobile\"
                        type=\"tel\"
                        placeholder=\"e.g. 9876543210\"
                        className=\"reg-text-input\"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Month/Year of Birth & Blood Group */}
                <div className=\"form-grid-2col\">
                  <div className=\"form-group-col\">
                    <div className=\"dob-label-row\">
                      <label htmlFor=\"reg-dob\" className=\"reg-label\">Month & Year of Birth</label>
                      {calculatedOwnerAge !== null && (
                        <span className=\"calculated-age-badge\">Age: {calculatedOwnerAge} yrs</span>
                      )}
                    </div>
                    <div className=\"reg-input-wrapper\">
                      <Cake size={18} className=\"reg-input-icon\" />
                      <input
                        id=\"reg-dob\"
                        type=\"month\"
                        className=\"reg-text-input\"
                        value={dobMonthYear}
                        onChange={(e) => setDobMonthYear(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className=\"form-group-col\">
                    <label htmlFor=\"reg-blood\" className=\"reg-label\">Blood Group</label>
                    <div className=\"reg-input-wrapper\">
                      <select
                        id=\"reg-blood\"
                        className=\"reg-text-input\"
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        style={{ paddingLeft: '14px' }}
                      >
                        <option value=\"\">Select Blood Group</option>
                        <option value=\"A+\">A+</option>
                        <option value=\"A-\">A-</option>
                        <option value=\"B+\">B+</option>
                        <option value=\"B-\">B-</option>
                        <option value=\"O+\">O+</option>
                        <option value=\"O-\">O-</option>
                        <option value=\"AB+\">AB+</option>
                        <option value=\"AB-\">AB-</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: FAMILY MEMBERS */}
              <div className=\"family-section-container animate-fade-in\">
                <div className=\"family-section-header\">
                  <div className=\"family-header-title-wrap\">
                    <Users size={20} className=\"family-section-icon\" />
                    <div className=\"family-title-block\">
                      <div className=\"family-title-with-info\">
                        <span className=\"family-section-title\">2. Residing Family Members</span>
                        <button
                          type=\"button\"
                          className=\"btn-family-info-badge\"
                          onClick={() => setIsFamilyInfoModalOpen(true)}
                        >
                          <Info size={12} />
                          <span>Why add family?</span>
                        </button>
                      </div>
                      <span className=\"family-section-subtitle\">
                        Add children, spouse, or parents for entry passes, emergency contacts & festival headcounts
                      </span>
                    </div>
                  </div>
                  <button
                    type=\"button\"
                    className=\"btn-add-family-popup\"
                    onClick={handleOpenAddFamilyModal}
                  >
                    <Plus size={15} />
                    <span>+ Add Member</span>
                  </button>
                </div>

                {/* Family Members Chips Grid */}
                {familyMembers.length > 0 ? (
                  <div className=\"family-members-chips-grid\">
                    {familyMembers.map((member, idx) => (
                      <div key={idx} className=\"family-member-chip-card animate-fade-in\">
                        <div className=\"family-chip-left\">
                          <div className=\"family-chip-avatar\">
                            {member.full_name ? member.full_name.charAt(0).toUpperCase() : 'F'}
                          </div>
                          <div className=\"family-chip-info\">
                            <span className=\"family-chip-name\">{member.full_name}</span>
                            <span className=\"family-chip-rel\">
                              {member.relationship}
                              {member.age ? ` • ${member.age} yrs` : ''}
                              {member.blood_group ? ` • ${member.blood_group}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className=\"family-chip-actions\">
                          <button
                            type=\"button\"
                            className=\"btn-chip-action edit\"
                            onClick={() => handleOpenEditFamilyModal(idx)}
                            title=\"Edit member\"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type=\"button\"
                            className=\"btn-chip-action delete\"
                            onClick={() => handleRemoveFamilyMember(idx)}
                            title=\"Remove member\"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`family-empty-placeholder ${isFamilyLiving ? 'mandatory-highlight' : ''}`}>
                    <Users size={20} className=\"family-empty-icon\" />
                    <div className=\"family-empty-text\">
                      <span className=\"family-empty-title\">
                        {isFamilyLiving ? 'Family member details required' : 'No family members added yet'}
                      </span>
                      <span className=\"family-empty-desc\">
                        {isFamilyLiving
                          ? 'Since you selected \"No, my family lives here\", please add at least 1 residing family member.'
                          : 'Click \"+ Add Member\" above to include family members living in your flat.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION C: PARKING DETAILS & ALLOCATED SLOTS */}
              <div className=\"parking-section-card animate-fade-in\">
                <div className=\"sub-section-header with-action\">
                  <div className=\"sub-section-title-left\">
                    <Car size={18} className=\"sub-section-icon\" />
                    <div className=\"sub-section-title-wrap\">
                      <span className=\"sub-section-title\">3. Parking Allocation & Vehicle Details</span>
                      <span className=\"sub-section-subtitle\">
                        Register your allocated basement/stilt slots and vehicles for security RFID & gate entry
                      </span>
                    </div>
                  </div>
                  <button
                    type=\"button\"
                    className=\"btn-add-vehicle-popup\"
                    onClick={handleOpenAddVehicleModal}
                  >
                    <Plus size={15} />
                    <span>+ Add Vehicle</span>
                  </button>
                </div>

                {/* Vehicle Chips Grid */}
                {vehicles.length > 0 ? (
                  <div className=\"vehicle-chips-grid\">
                    {vehicles.map((veh, idx) => (
                      <div key={idx} className=\"vehicle-chip-card animate-fade-in\">
                        <div className=\"vehicle-chip-left\">
                          <div className=\"vehicle-chip-icon-badge\">
                            <Car size={16} />
                          </div>
                          <div className=\"vehicle-chip-info\">
                            <div className=\"vehicle-chip-top-row\">
                              <span className=\"vehicle-chip-slot\">Slot: {veh.slot_number || 'TBD'}</span>
                              <span className=\"vehicle-chip-type-tag\">{veh.vehicle_type}</span>
                            </div>
                            <span className=\"vehicle-chip-model\">
                              {veh.make_model || 'Vehicle'} {veh.reg_number ? `(${veh.reg_number})` : ''}
                            </span>
                          </div>
                        </div>
                        <div className=\"vehicle-chip-actions\">
                          <button
                            type=\"button\"
                            className=\"btn-chip-action edit\"
                            onClick={() => handleOpenEditVehicleModal(idx)}
                            title=\"Edit vehicle\"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type=\"button\"
                            className=\"btn-chip-action delete\"
                            onClick={() => handleRemoveVehicle(idx)}
                            title=\"Remove vehicle\"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className=\"family-empty-placeholder\">
                    <Car size={20} className=\"family-empty-icon\" />
                    <div className=\"family-empty-text\">
                      <span className=\"family-empty-title\">No vehicles registered yet</span>
                      <span className=\"family-empty-desc\">
                        Click \"+ Add Vehicle\" above to register your parking slot and car / two-wheeler details.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2 Actions */}
              <div className=\"wizard-action-row two-buttons\">
                <button
                  type=\"button\"
                  className=\"btn-wizard-back\"
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <button
                  type=\"button\"
                  className=\"btn-wizard-next\"
                  onClick={handleNextToStep3}
                >
                  <span>{isRented ? 'Continue to Tenant Details' : 'Continue to Confirmation'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 (IF RENTED): TENANT VERIFICATION & RENTAL AGREEMENT */}
          {currentStep === 3 && isRented && (
            <div className=\"wizard-step-content animate-fade-in\">
              <div className=\"rental-section-container animate-fade-in\">
                <div className=\"rental-header-badge\">
                  <KeyRound size={20} className=\"rental-badge-icon\" />
                  <div className=\"rental-badge-text\">
                    <span className=\"rental-badge-title\">Tenant Verification & Rental Agreement</span>
                    <span className=\"rental-badge-sub\">
                      Required for security gate passes, digital tenant app onboarding, and bylaws compliance.
                    </span>
                  </div>
                </div>

                <div className=\"form-group-full\">
                  <label htmlFor=\"reg-tenant-name\" className=\"reg-label\">Primary Tenant Full Name *</label>
                  <div className=\"reg-input-wrapper\">
                    <User size={18} className=\"reg-input-icon\" />
                    <input
                      id=\"reg-tenant-name\"
                      type=\"text\"
                      placeholder=\"e.g. Suresh Varma\"
                      className=\"reg-text-input\"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                    />
                  </div>
                </div>

                <div className=\"form-grid-2col\">
                  <div className=\"form-group-col\">
                    <label htmlFor=\"reg-tenant-mobile\" className=\"reg-label\">Tenant Mobile Number *</label>
                    <div className=\"reg-input-wrapper\">
                      <Phone size={18} className=\"reg-input-icon\" />
                      <input
                        id=\"reg-tenant-mobile\"
                        type=\"tel\"
                        placeholder=\"e.g. 9123456789\"
                        className=\"reg-text-input\"
                        value={tenantMobile}
                        onChange={(e) => setTenantMobile(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className=\"form-group-col\">
                    <label htmlFor=\"reg-tenant-email\" className=\"reg-label\">Tenant Email Address</label>
                    <div className=\"reg-input-wrapper\">
                      <Mail size={18} className=\"reg-input-icon\" />
                      <input
                        id=\"reg-tenant-email\"
                        type=\"email\"
                        placeholder=\"tenant@gmail.com\"
                        className=\"reg-text-input\"
                        value={tenantEmail}
                        onChange={(e) => setTenantEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className=\"form-group-full\">
                  <label className=\"reg-label\">Rental Agreement Document (PDF / Image) *</label>
                  <input
                    type=\"file\"
                    ref={rentalFileInputRef}
                    style={{ display: 'none' }}
                    accept=\".pdf,.jpg,.jpeg,.png,.webp\"
                    onChange={handleRentalFileChange}
                  />

                  {rentalAgreementFile || rentalAgreementUrl ? (
                    <div className=\"uploaded-file-card animate-fade-in\">
                      <div className=\"uploaded-file-info\">
                        <FileCheck size={20} className=\"uploaded-file-icon\" />
                        <div className=\"uploaded-file-details\">
                          <span className=\"uploaded-file-name\">
                            {rentalAgreementFile?.name || 'Rental_Agreement_Document.pdf'}
                          </span>
                          <span className=\"uploaded-file-size\">
                            {isUploadingRentalDoc ? 'Uploading document...' : '✓ Document uploaded & attached'}
                          </span>
                        </div>
                      </div>
                      <button
                        type=\"button\"
                        className=\"btn-remove-file\"
                        onClick={() => {
                          setRentalAgreementFile(null);
                          setRentalAgreementUrl('');
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type=\"button\"
                      className=\"document-upload-dropzone\"
                      onClick={() => rentalFileInputRef.current?.click()}
                    >
                      <UploadCloud size={24} className=\"upload-cloud-icon\" />
                      <span className=\"upload-dropzone-title\">Click to Browse Agreement Document</span>
                      <span className=\"upload-dropzone-sub\">PDF, JPG or PNG up to 15MB</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Step 3 Actions */}
              <div className=\"wizard-action-row two-buttons\">
                <button
                  type=\"button\"
                  className=\"btn-wizard-back\"
                  onClick={() => setCurrentStep(2)}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <button
                  type=\"button\"
                  className=\"btn-wizard-next\"
                  onClick={handleNextToStep4}
                >
                  <span>Continue to Confirmation</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* FINAL STEP: SUMMARY CONFIRMATION & GOOGLE OAUTH SUBMISSION */}
          {currentStep === finalConfirmationStep && (
            <div className=\"wizard-step-content animate-fade-in\">
              <div className=\"summary-overview-card animate-fade-in\">
                <div className=\"summary-row\">
                  <span className=\"summary-key\">Flat Number</span>
                  <span className=\"summary-val\">{selectedFlat?.flat_number || flatQuery}</span>
                </div>
                <div className=\"summary-row\">
                  <span className=\"summary-key\">Owner Name</span>
                  <span className=\"summary-val\">{fullName}</span>
                </div>
                <div className=\"summary-row\">
                  <span className=\"summary-key\">Google Account</span>
                  <span className=\"summary-val\">{email}</span>
                </div>
                <div className=\"summary-row\">
                  <span className=\"summary-key\">WhatsApp Mobile</span>
                  <span className=\"summary-val\">{mobileNumber}</span>
                </div>
                {bloodGroup && (
                  <div className=\"summary-row\">
                    <span className=\"summary-key\">Blood Group</span>
                    <span className=\"summary-val\">{bloodGroup}</span>
                  </div>
                )}
                <div className=\"summary-row\">
                  <span className=\"summary-key\">Occupancy</span>
                  <span className=\"summary-val\">{occupancyStatus}</span>
                </div>
                <div className=\"summary-row\">
                  <span className=\"summary-key\">Family Members</span>
                  <span className=\"summary-val\">{familyMembers.length} member(s)</span>
                </div>
                <div className=\"summary-row\">
                  <span className=\"summary-key\">Registered Vehicles</span>
                  <span className=\"summary-val\">{vehicles.length} vehicle(s)</span>
                </div>
                {isRented && (
                  <>
                    <div className=\"summary-divider\" />
                    <div className=\"summary-row\">
                      <span className=\"summary-key\">Tenant Name</span>
                      <span className=\"summary-val\">{tenantName}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Society Important Information Banner (Moved from Step 2 to Confirmation) */}
              <div className=\"family-benefits-banner animate-fade-in\" style={{ marginTop: '4px' }}>
                <div className=\"family-benefit-item\">
                  <CheckCircle2 size={16} className=\"benefit-icon\" />
                  <span className=\"benefit-text\">
                    <strong>Official Community Records:</strong> Member details assist emergency blood group alerts, security intercoms & accurate event food catering.
                  </span>
                </div>
                <div className=\"family-benefit-item\">
                  <ShieldCheck size={16} className=\"benefit-icon\" />
                  <span className=\"benefit-text\">
                    <strong>Security Verification:</strong> Resident applications are verified by society management before granting full clubhouse access.
                  </span>
                </div>
              </div>

              {/* Bylaws Certification Checkbox */}
              <label className=\"form-checkbox-row\" style={{ marginTop: '8px' }}>
                <input
                  type=\"checkbox\"
                  className=\"reg-checkbox\"
                  checked={agreedToRules}
                  onChange={(e) => setAgreedToRules(e.target.checked)}
                />
                <span className=\"reg-checkbox-label\">
                  I certify that I am the legal owner/resident of <strong>Flat {selectedFlat?.flat_number || flatQuery}</strong> in BPS Twin Towers and agree to abide by the society rules and bylaws.
                </span>
              </label>

              {/* Final Submit Button */}
              <div className=\"wizard-action-row two-buttons\">
                <button
                  type=\"button\"
                  className=\"btn-wizard-back\"
                  onClick={() => setCurrentStep(isRented ? 3 : 2)}
                  disabled={loading}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <button
                  type=\"button\"
                  className=\"btn-primary-register\"
                  onClick={handleGoogleSubmit}
                  disabled={loading || !agreedToRules}
                >
                  <span>{loading ? 'Connecting to Google...' : 'Complete Registration with Google'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Navigation Link */}
          <p className=\"register-footer-text\">
            Already registered your flat?{' '}
            <Link to=\"/login\" className=\"register-footer-link\">
              Sign In to Resident Portal
            </Link>
          </p>
        </div>
      </div>

      {/* ====================================================================
          FAMILY MEMBER MODAL POPUP
          ==================================================================== */}
      {isFamilyModalOpen && (
        <div className=\"family-modal-overlay animate-fade-in\">
          <div className=\"family-modal-dialog animate-scale-in\">
            <div className=\"family-modal-header\">
              <div className=\"family-modal-header-left\">
                <UserPlus size={20} className=\"family-modal-icon\" />
                <h3 className=\"family-modal-title\">
                  {editingFamilyIndex !== null ? 'Edit Family Member' : 'Add Family Member'}
                </h3>
              </div>
              <button
                type=\"button\"
                className=\"btn-modal-close\"
                onClick={() => setIsFamilyModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className=\"family-modal-body\">
              {famModalError && (
                <div className=\"register-error-alert animate-fade-in\" style={{ margin: 0 }}>
                  <AlertCircle size={16} />
                  <span>{famModalError}</span>
                </div>
              )}

              <div className=\"form-group-full\">
                <label className=\"reg-label\">Full Name *</label>
                <input
                  type=\"text\"
                  placeholder=\"e.g. Priya Sharma\"
                  className=\"reg-text-input\"
                  value={famName}
                  onChange={(e) => setFamName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className=\"form-grid-2col\">
                <div className=\"form-group-col\">
                  <label className=\"reg-label\">Relationship</label>
                  <select
                    className=\"reg-text-input\"
                    value={famRelation}
                    onChange={(e) => setFamRelation(e.target.value)}
                  >
                    <option value=\"Spouse\">Spouse</option>
                    <option value=\"Child\">Child (Son / Daughter)</option>
                    <option value=\"Parent\">Parent (Father / Mother)</option>
                    <option value=\"Sibling\">Sibling (Brother / Sister)</option>
                    <option value=\"Relative\">Other Relative</option>
                  </select>
                </div>

                <div className=\"form-group-col\">
                  <label className=\"reg-label\">Blood Group</label>
                  <select
                    className=\"reg-text-input\"
                    value={famBloodGroup}
                    onChange={(e) => setFamBloodGroup(e.target.value)}
                  >
                    <option value=\"\">Select Blood Group</option>
                    <option value=\"A+\">A+</option>
                    <option value=\"A-\">A-</option>
                    <option value=\"B+\">B+</option>
                    <option value=\"B-\">B-</option>
                    <option value=\"O+\">O+</option>
                    <option value=\"O-\">O-</option>
                    <option value=\"AB+\">AB+</option>
                    <option value=\"AB-\">AB-</option>
                  </select>
                </div>
              </div>

              <div className=\"form-grid-2col\">
                <div className=\"form-group-col\">
                  <div className=\"dob-label-row\">
                    <label className=\"reg-label\">Month & Year of Birth</label>
                    {calculatedFamAge !== null && (
                      <span className=\"calculated-age-badge\">Age: {calculatedFamAge} yrs</span>
                    )}
                  </div>
                  <input
                    type=\"month\"
                    className=\"reg-text-input\"
                    value={famDob}
                    onChange={(e) => setFamDob(e.target.value)}
                  />
                </div>

                <div className=\"form-group-col\">
                  <label className=\"reg-label\">Mobile Number (Optional)</label>
                  <input
                    type=\"tel\"
                    placeholder=\"e.g. 9876543210\"
                    className=\"reg-text-input\"
                    value={famMobile}
                    onChange={(e) => setFamMobile(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className=\"family-modal-footer\">
              <button
                type=\"button\"
                className=\"btn-modal-cancel\"
                onClick={() => setIsFamilyModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type=\"button\"
                className=\"btn-modal-save\"
                onClick={handleSaveFamilyMember}
              >
                <CheckCircle2 size={16} />
                <span>Save Member</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          VEHICLE MODAL POPUP
          ==================================================================== */}
      {isVehicleModalOpen && (
        <div className=\"family-modal-overlay animate-fade-in\">
          <div className=\"family-modal-dialog animate-scale-in\">
            <div className=\"family-modal-header\">
              <div className=\"family-modal-header-left\">
                <Car size={20} className=\"family-modal-icon\" />
                <h3 className=\"family-modal-title\">
                  {editingVehicleIndex !== null ? 'Edit Vehicle Details' : 'Add Vehicle & Slot'}
                </h3>
              </div>
              <button
                type=\"button\"
                className=\"btn-modal-close\"
                onClick={() => setIsVehicleModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className=\"family-modal-body\">
              {vehModalError && (
                <div className=\"register-error-alert animate-fade-in\" style={{ margin: 0 }}>
                  <AlertCircle size={16} />
                  <span>{vehModalError}</span>
                </div>
              )}

              <div className=\"form-grid-2col\">
                <div className=\"form-group-col\">
                  <label className=\"reg-label\">Parking Slot No.</label>
                  <input
                    type=\"text\"
                    placeholder=\"e.g. B1-42 or Stilt-12\"
                    className=\"reg-text-input\"
                    value={vehSlot}
                    onChange={(e) => setVehSlot(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className=\"form-group-col\">
                  <label className=\"reg-label\">Vehicle Type</label>
                  <select
                    className=\"reg-text-input\"
                    value={vehType}
                    onChange={(e) => setVehType(e.target.value)}
                  >
                    <option value=\"4W (Car)\">4W (Car)</option>
                    <option value=\"2W (Bike/Scooter)\">2W (Bike/Scooter)</option>
                    <option value=\"EV Car\">EV Car</option>
                    <option value=\"EV 2W\">EV 2W</option>
                  </select>
                </div>
              </div>

              <div className=\"form-grid-2col\">
                <div className=\"form-group-col\">
                  <label className=\"reg-label\">Make & Model</label>
                  <input
                    type=\"text\"
                    placeholder=\"e.g. Hyundai Creta\"
                    className=\"reg-text-input\"
                    value={vehMakeModel}
                    onChange={(e) => setVehMakeModel(e.target.value)}
                  />
                </div>

                <div className=\"form-group-col\">
                  <label className=\"reg-label\">Registration Number</label>
                  <input
                    type=\"text\"
                    placeholder=\"e.g. TS 09 AB 1234\"
                    className=\"reg-text-input\"
                    value={vehRegNumber}
                    onChange={(e) => setVehRegNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className=\"form-group-full\">
                <label className=\"reg-label\">Colour / Remarks (Optional)</label>
                <input
                  type=\"text\"
                  placeholder=\"e.g. White color, FASTag enabled\"
                  className=\"reg-text-input\"
                  value={vehColour}
                  onChange={(e) => setVehColour(e.target.value)}
                />
              </div>
            </div>

            <div className=\"family-modal-footer\">
              <button
                type=\"button\"
                className=\"btn-modal-cancel\"
                onClick={() => setIsVehicleModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type=\"button\"
                className=\"btn-modal-save\"
                onClick={handleSaveVehicle}
              >
                <CheckCircle2 size={16} />
                <span>Save Vehicle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          INFO MODAL POPUP: WHY ADD FAMILY MEMBERS?
          ==================================================================== */}
      {isFamilyInfoModalOpen && (
        <div className=\"family-modal-overlay animate-fade-in\">
          <div className=\"family-modal-dialog info-modal animate-scale-in\">
            <div className=\"family-modal-header\">
              <div className=\"family-modal-header-left\">
                <HeartHandshake size={20} className=\"family-modal-icon\" />
                <h3 className=\"family-modal-title\">Why Add Residing Family Members?</h3>
              </div>
              <button
                type=\"button\"
                className=\"btn-modal-close\"
                onClick={() => setIsFamilyInfoModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className=\"family-modal-body\">
              <div className=\"info-popup-benefit-card\">
                <div className=\"info-benefit-icon-badge\">
                  <Users size={18} />
                </div>
                <div className=\"info-benefit-content\">
                  <h4>Accurate Community Headcount</h4>
                  <p>Enables accurate planning for society dinners, festival prasad, puja arrangements, and community events.</p>
                </div>
              </div>

              <div className=\"info-popup-benefit-card\">
                <div className=\"info-benefit-icon-badge\">
                  <ShieldCheck size={18} />
                </div>
                <div className=\"info-benefit-content\">
                  <h4>Emergency & Security Support</h4>
                  <p>In case of emergencies or medical assistance, society guards and emergency responders have instant family contact information.</p>
                </div>
              </div>

              <div className=\"info-popup-benefit-card\">
                <div className=\"info-benefit-icon-badge\">
                  <KeyRound size={18} />
                </div>
                <div className=\"info-benefit-content\">
                  <h4>Access & Facilities</h4>
                  <p>Enables registered family members to utilize clubhouse amenities, book badminton courts, and access resident features.</p>
                </div>
              </div>
            </div>

            <div className=\"family-modal-footer\">
              <button
                type=\"button\"
                className=\"btn-modal-save\"
                onClick={() => setIsFamilyInfoModalOpen(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};