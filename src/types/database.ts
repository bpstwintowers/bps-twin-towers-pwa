export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          action_url: string | null
          category: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          message: string
          priority: string
          published_at: string | null
          status: string
          target_audience: string
          target_block: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_url?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message: string
          priority?: string
          published_at?: string | null
          status?: string
          target_audience?: string
          target_block?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_url?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string
          published_at?: string | null
          status?: string
          target_audience?: string
          target_block?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          created_at: string
          id: string
          name: string
          society_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          society_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          society_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_attachments: {
        Row: {
          complaint_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          uploaded_by: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          uploaded_by: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_attachments_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaint_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_categories: {
        Row: {
          default_sla_hours: number
          default_team: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          default_sla_hours?: number
          default_team?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          default_sla_hours?: number
          default_team?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      complaint_comments: {
        Row: {
          author_id: string
          comment: string
          complaint_id: string
          created_at: string
          id: string
          is_internal: boolean
        }
        Insert: {
          author_id: string
          comment: string
          complaint_id: string
          created_at?: string
          id?: string
          is_internal?: boolean
        }
        Update: {
          author_id?: string
          comment?: string
          complaint_id?: string
          created_at?: string
          id?: string
          is_internal?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "complaint_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaint_comments_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          assigned_team: string | null
          assigned_to: string | null
          category: string
          closed_at: string | null
          complaint_number: string
          created_at: string
          created_by: string
          description: string
          due_at: string
          facility_id: string | null
          flat_id: string | null
          id: string
          location_detail: string | null
          location_type: string
          priority: string
          reopen_count: number
          reopen_reason: string | null
          reopened_at: string | null
          resolution_summary: string | null
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_team?: string | null
          assigned_to?: string | null
          category: string
          closed_at?: string | null
          complaint_number: string
          created_at?: string
          created_by: string
          description: string
          due_at: string
          facility_id?: string | null
          flat_id?: string | null
          id?: string
          location_detail?: string | null
          location_type?: string
          priority?: string
          reopen_count?: number
          reopen_reason?: string | null
          reopened_at?: string | null
          resolution_summary?: string | null
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_team?: string | null
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          complaint_number?: string
          created_at?: string
          created_by?: string
          description?: string
          due_at?: string
          facility_id?: string | null
          flat_id?: string | null
          id?: string
          location_detail?: string | null
          location_type?: string
          priority?: string
          reopen_count?: number
          reopen_reason?: string | null
          reopened_at?: string | null
          resolution_summary?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_campaigns: {
        Row: {
          banner_url: string | null
          cancellation_reason: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          start_date: string
          status: string
          target_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          cancellation_reason?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          start_date: string
          status?: string
          target_amount?: number
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          cancellation_reason?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          campaign_id: string
          created_at: string
          donated_at: string
          donor_email: string | null
          donor_mobile: string | null
          donor_name: string
          flat_id: string | null
          id: string
          notes: string | null
          payment_method: string
          payment_reference: string | null
          receipt_number: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          campaign_id: string
          created_at?: string
          donated_at?: string
          donor_email?: string | null
          donor_mobile?: string | null
          donor_name: string
          flat_id?: string | null
          id?: string
          notes?: string | null
          payment_method: string
          payment_reference?: string | null
          receipt_number?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string
          created_at?: string
          donated_at?: string
          donor_email?: string | null
          donor_mobile?: string | null
          donor_name?: string
          flat_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          receipt_number?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          flat_id: string | null
          flat_member_id: string | null
          id: string
          notes: string | null
          participant_email: string | null
          participant_mobile: string | null
          participant_name: string
          participant_type: string
          quantity: number
          registered_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          flat_id?: string | null
          flat_member_id?: string | null
          id?: string
          notes?: string | null
          participant_email?: string | null
          participant_mobile?: string | null
          participant_name: string
          participant_type?: string
          quantity?: number
          registered_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          flat_id?: string | null
          flat_member_id?: string | null
          id?: string
          notes?: string | null
          participant_email?: string | null
          participant_mobile?: string | null
          participant_name?: string
          participant_type?: string
          quantity?: number
          registered_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_flat_member_id_fkey"
            columns: ["flat_member_id"]
            isOneToOne: false
            referencedRelation: "flat_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          cancellation_reason: string | null
          capacity: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          end_time: string
          id: string
          organizer: string | null
          published_at: string | null
          registration_end: string | null
          registration_required: boolean
          registration_start: string | null
          start_date: string
          start_time: string
          status: string
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          banner_url?: string | null
          cancellation_reason?: string | null
          capacity?: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          end_time: string
          id?: string
          organizer?: string | null
          published_at?: string | null
          registration_end?: string | null
          registration_required?: boolean
          registration_start?: string | null
          start_date: string
          start_time: string
          status?: string
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          banner_url?: string | null
          cancellation_reason?: string | null
          capacity?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          end_time?: string
          id?: string
          organizer?: string | null
          published_at?: string | null
          registration_end?: string | null
          registration_required?: boolean
          registration_start?: string | null
          start_date?: string
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          advance_booking_days: number
          approval_required: boolean
          booking_required: boolean
          capacity: number
          category: string
          closing_time: string
          created_at: string
          description: string | null
          id: string
          location: string | null
          name: string
          opening_time: string
          rules_terms: string | null
          slot_duration_minutes: number
          status: string
          updated_at: string
        }
        Insert: {
          advance_booking_days?: number
          approval_required?: boolean
          booking_required?: boolean
          capacity?: number
          category: string
          closing_time?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name: string
          opening_time?: string
          rules_terms?: string | null
          slot_duration_minutes?: number
          status?: string
          updated_at?: string
        }
        Update: {
          advance_booking_days?: number
          approval_required?: boolean
          booking_required?: boolean
          capacity?: number
          category?: string
          closing_time?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          opening_time?: string
          rules_terms?: string | null
          slot_duration_minutes?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      facility_blocks: {
        Row: {
          block_date: string
          created_at: string
          created_by: string | null
          end_time: string
          facility_id: string
          id: string
          reason: string
          start_time: string
          status: string
        }
        Insert: {
          block_date: string
          created_at?: string
          created_by?: string | null
          end_time: string
          facility_id: string
          id?: string
          reason: string
          start_time: string
          status?: string
        }
        Update: {
          block_date?: string
          created_at?: string
          created_by?: string | null
          end_time?: string
          facility_id?: string
          id?: string
          reason?: string
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_blocks_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_bookings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          booked_by: string
          booking_date: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          end_time: string
          facility_id: string
          flat_id: string
          id: string
          participant_count: number
          purpose: string | null
          rejection_reason: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          booked_by: string
          booking_date: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          end_time: string
          facility_id: string
          flat_id: string
          id?: string
          participant_count?: number
          purpose?: string | null
          rejection_reason?: string | null
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          booked_by?: string
          booking_date?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          end_time?: string
          facility_id?: string
          flat_id?: string
          id?: string
          participant_count?: number
          purpose?: string | null
          rejection_reason?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_bookings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_bookings_booked_by_fkey"
            columns: ["booked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_bookings_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_bookings_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      flat_members: {
        Row: {
          created_at: string
          date_of_birth: string | null
          email: string | null
          end_date: string | null
          flat_id: string
          full_name: string | null
          id: string
          joined_at: string
          membership_type: string
          mobile: string | null
          parking_details: string | null
          relationship: string
          resident_type: string | null
          show_email: boolean
          show_mobile: boolean
          show_photo: boolean
          start_date: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          end_date?: string | null
          flat_id: string
          full_name?: string | null
          id?: string
          joined_at?: string
          membership_type?: string
          mobile?: string | null
          parking_details?: string | null
          relationship?: string
          resident_type?: string | null
          show_email?: boolean
          show_mobile?: boolean
          show_photo?: boolean
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          end_date?: string | null
          flat_id?: string
          full_name?: string | null
          id?: string
          joined_at?: string
          membership_type?: string
          mobile?: string | null
          parking_details?: string | null
          relationship?: string
          resident_type?: string | null
          show_email?: boolean
          show_mobile?: boolean
          show_photo?: boolean
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flat_members_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flat_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flat_parking: {
        Row: {
          allocated_at: string | null
          allocation_status: string
          created_at: string
          flat_id: string
          id: string
          parking_id: string
          updated_at: string
        }
        Insert: {
          allocated_at?: string | null
          allocation_status?: string
          created_at?: string
          flat_id: string
          id?: string
          parking_id: string
          updated_at?: string
        }
        Update: {
          allocated_at?: string | null
          allocation_status?: string
          created_at?: string
          flat_id?: string
          id?: string
          parking_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flat_parking_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flat_parking_parking_id_fkey"
            columns: ["parking_id"]
            isOneToOne: false
            referencedRelation: "parking"
            referencedColumns: ["id"]
          },
        ]
      }
      flats: {
        Row: {
          area_sqft: number | null
          bhk: string | null
          block_id: string
          created_at: string
          flat_number: string
          floor_name: string | null
          floor_number: number
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          area_sqft?: number | null
          bhk?: string | null
          block_id: string
          created_at?: string
          flat_number: string
          floor_name?: string | null
          floor_number: number
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          area_sqft?: number | null
          bhk?: string | null
          block_id?: string
          created_at?: string
          flat_number?: string
          floor_name?: string | null
          floor_number?: number
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flats_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      gates: {
        Row: {
          code: string
          created_at: string
          gate_type: string
          id: string
          location: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          gate_type?: string
          id?: string
          location?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          gate_type?: string
          id?: string
          location?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          block_id: string | null
          created_at: string
          description: string | null
          floor_number: number | null
          id: string
          location_type: string
          name: string
          society_id: string
          status: string
          updated_at: string
        }
        Insert: {
          block_id?: string | null
          created_at?: string
          description?: string | null
          floor_number?: number | null
          id?: string
          location_type: string
          name: string
          society_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          block_id?: string | null
          created_at?: string
          description?: string | null
          floor_number?: number | null
          id?: string
          location_type?: string
          name?: string
          society_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_society_id_fkey"
            columns: ["society_id"]
            isOneToOne: false
            referencedRelation: "societies"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          id: string
          in_app_announcements: boolean
          in_app_events: boolean
          in_app_finance: boolean
          in_app_sponsors: boolean
          in_app_volunteers: boolean
          push_announcements: boolean
          push_enabled: boolean
          push_events: boolean
          push_finance: boolean
          push_volunteers: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          in_app_announcements?: boolean
          in_app_events?: boolean
          in_app_finance?: boolean
          in_app_sponsors?: boolean
          in_app_volunteers?: boolean
          push_announcements?: boolean
          push_enabled?: boolean
          push_events?: boolean
          push_finance?: boolean
          push_volunteers?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          in_app_announcements?: boolean
          in_app_events?: boolean
          in_app_finance?: boolean
          in_app_sponsors?: boolean
          in_app_volunteers?: boolean
          push_announcements?: boolean
          push_enabled?: boolean
          push_events?: boolean
          push_finance?: boolean
          push_volunteers?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          priority: string
          recipient: string
          reference_id: string | null
          reference_type: string | null
          title: string
        }
        Insert: {
          action_url?: string | null
          category?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          priority?: string
          recipient: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
        }
        Update: {
          action_url?: string | null
          category?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          priority?: string
          recipient?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_fkey"
            columns: ["recipient"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parking: {
        Row: {
          created_at: string
          id: string
          parking_category: string | null
          parking_number: string
          parking_type: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          parking_category?: string | null
          parking_number: string
          parking_type?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          parking_category?: string | null
          parking_number?: string
          parking_type?: string | null
          status?: string
        }
        Relationships: []
      }
      parking_documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          document_type: string | null
          file_name: string
          file_path: string
          file_size: number
          flat_id: string
          id: string
          mime_type: string
          parking_id: string | null
          registration_id: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          document_type?: string | null
          file_name: string
          file_path: string
          file_size: number
          flat_id: string
          id?: string
          mime_type: string
          parking_id?: string | null
          registration_id?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          document_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          flat_id?: string
          id?: string
          mime_type?: string
          parking_id?: string | null
          registration_id?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_documents_flat_parking_fk"
            columns: ["flat_id", "parking_id"]
            isOneToOne: false
            referencedRelation: "flat_parking"
            referencedColumns: ["flat_id", "parking_id"]
          },
          {
            foreignKeyName: "parking_documents_registration_fk"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      pooja_bookings: {
        Row: {
          amount: number
          booking_date: string
          booking_ref: string
          created_at: string | null
          flat_id: string | null
          id: string
          ritual_name: string
          status: string
          time_slot: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          booking_date: string
          booking_ref: string
          created_at?: string | null
          flat_id?: string | null
          id?: string
          ritual_name: string
          status?: string
          time_slot: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          booking_date?: string
          booking_ref?: string
          created_at?: string | null
          flat_id?: string | null
          id?: string
          ritual_name?: string
          status?: string
          time_slot?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pooja_bookings_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          mobile: string | null
          parking_details: string | null
          photo_url: string | null
          resident_since: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          mobile?: string | null
          parking_details?: string | null
          photo_url?: string | null
          resident_since?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          mobile?: string | null
          parking_details?: string | null
          photo_url?: string | null
          resident_since?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_requests: {
        Row: {
          correction_message: string | null
          created_at: string
          flat_id: string
          id: string
          mobile: string | null
          parking_details: string | null
          rejection_reason: string | null
          relationship: string
          remarks: string | null
          requested_membership_type: string
          resident_since: string | null
          resident_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          correction_message?: string | null
          created_at?: string
          flat_id: string
          id?: string
          mobile?: string | null
          parking_details?: string | null
          rejection_reason?: string | null
          relationship?: string
          remarks?: string | null
          requested_membership_type?: string
          resident_since?: string | null
          resident_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          correction_message?: string | null
          created_at?: string
          flat_id?: string
          id?: string
          mobile?: string | null
          parking_details?: string | null
          rejection_reason?: string | null
          relationship?: string
          remarks?: string | null
          requested_membership_type?: string
          resident_since?: string | null
          resident_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_requests_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      societies: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sponsor_contributions: {
        Row: {
          amount: number | null
          contributed_at: string
          contribution_type: string
          created_at: string
          id: string
          in_kind_description: string | null
          in_kind_estimated_value: number | null
          in_kind_quantity: number | null
          in_kind_unit: string | null
          payment_method: string | null
          payment_reference: string | null
          receipt_number: string | null
          rejection_reason: string | null
          sponsorship_id: string
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number | null
          contributed_at?: string
          contribution_type: string
          created_at?: string
          id?: string
          in_kind_description?: string | null
          in_kind_estimated_value?: number | null
          in_kind_quantity?: number | null
          in_kind_unit?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_number?: string | null
          rejection_reason?: string | null
          sponsorship_id: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number | null
          contributed_at?: string
          contribution_type?: string
          created_at?: string
          id?: string
          in_kind_description?: string | null
          in_kind_estimated_value?: number | null
          in_kind_quantity?: number | null
          in_kind_unit?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_number?: string | null
          rejection_reason?: string | null
          sponsorship_id?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_contributions_sponsorship_id_fkey"
            columns: ["sponsorship_id"]
            isOneToOne: false
            referencedRelation: "sponsorships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_contributions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_tiers: {
        Row: {
          benefits: string[]
          created_at: string
          description: string | null
          display_order: number
          id: string
          minimum_amount: number
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          benefits?: string[]
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          minimum_amount?: number
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          benefits?: string[]
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          minimum_amount?: number
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          contact_name: string
          created_at: string
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          profile_id: string | null
          rejection_reason: string | null
          sponsor_type: string
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          profile_id?: string | null
          rejection_reason?: string | null
          sponsor_type: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          profile_id?: string | null
          rejection_reason?: string | null
          sponsor_type?: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorships: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          campaign_id: string | null
          created_at: string
          created_by: string | null
          event_id: string | null
          id: string
          notes: string | null
          sponsor_id: string
          status: string
          tier_id: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          sponsor_id: string
          status?: string
          tier_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id?: string | null
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          sponsor_id?: string
          status?: string
          tier_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorships_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "sponsor_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_invitations: {
        Row: {
          created_at: string
          expected_date: string
          expected_time: string | null
          host_flat_id: string
          id: string
          invited_by: string | null
          pass_code: string
          purpose: string | null
          status: string
          updated_at: string
          valid_until: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          expected_date?: string
          expected_time?: string | null
          host_flat_id: string
          id?: string
          invited_by?: string | null
          pass_code: string
          purpose?: string | null
          status?: string
          updated_at?: string
          valid_until: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          expected_date?: string
          expected_time?: string | null
          host_flat_id?: string
          id?: string
          invited_by?: string | null
          pass_code?: string
          purpose?: string | null
          status?: string
          updated_at?: string
          valid_until?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_invitations_host_flat_id_fkey"
            columns: ["host_flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_invitations_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          company: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string
          updated_at: string
          vehicle_number: string | null
          vehicle_type: string | null
          visitor_type: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
          vehicle_number?: string | null
          vehicle_type?: string | null
          visitor_type: string
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
          vehicle_number?: string | null
          vehicle_type?: string | null
          visitor_type?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          created_at: string
          entry_by: string | null
          entry_gate_id: string
          entry_time: string
          exit_by: string | null
          exit_gate_id: string | null
          exit_time: string | null
          flat_id: string
          id: string
          invitation_id: string | null
          notes: string | null
          purpose: string | null
          status: string
          updated_at: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          entry_by?: string | null
          entry_gate_id: string
          entry_time?: string
          exit_by?: string | null
          exit_gate_id?: string | null
          exit_time?: string | null
          flat_id: string
          id?: string
          invitation_id?: string | null
          notes?: string | null
          purpose?: string | null
          status?: string
          updated_at?: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          entry_by?: string | null
          entry_gate_id?: string
          entry_time?: string
          exit_by?: string | null
          exit_gate_id?: string | null
          exit_time?: string | null
          flat_id?: string
          id?: string
          invitation_id?: string | null
          notes?: string | null
          purpose?: string | null
          status?: string
          updated_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_entry_by_fkey"
            columns: ["entry_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_entry_gate_id_fkey"
            columns: ["entry_gate_id"]
            isOneToOne: false
            referencedRelation: "gates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_exit_by_fkey"
            columns: ["exit_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_exit_gate_id_fkey"
            columns: ["exit_gate_id"]
            isOneToOne: false
            referencedRelation: "gates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "visitor_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_assignments: {
        Row: {
          assigned_at: string
          attendance: string
          created_at: string
          flat_id: string | null
          id: string
          notes: string | null
          opportunity_id: string
          status: string
          updated_at: string
          user_id: string
          volunteer_email: string | null
          volunteer_mobile: string | null
          volunteer_name: string
        }
        Insert: {
          assigned_at?: string
          attendance?: string
          created_at?: string
          flat_id?: string | null
          id?: string
          notes?: string | null
          opportunity_id: string
          status?: string
          updated_at?: string
          user_id: string
          volunteer_email?: string | null
          volunteer_mobile?: string | null
          volunteer_name: string
        }
        Update: {
          assigned_at?: string
          attendance?: string
          created_at?: string
          flat_id?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          volunteer_email?: string | null
          volunteer_mobile?: string | null
          volunteer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_assignments_flat_id_fkey"
            columns: ["flat_id"]
            isOneToOne: false
            referencedRelation: "flats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "volunteer_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_opportunities: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          end_time: string
          event_id: string | null
          id: string
          required_volunteers: number
          role_name: string
          start_date: string
          start_time: string
          status: string
          team_id: string
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          end_time: string
          event_id?: string | null
          id?: string
          required_volunteers?: number
          role_name?: string
          start_date: string
          start_time: string
          status?: string
          team_id: string
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          end_time?: string
          event_id?: string | null
          id?: string
          required_volunteers?: number
          role_name?: string
          start_date?: string
          start_time?: string
          status?: string
          team_id?: string
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_opportunities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_opportunities_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "volunteer_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_teams: {
        Row: {
          category: string
          coordinator_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          coordinator_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          coordinator_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_teams_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_member: {
        Args: { p_member_id: string }
        Returns: {
          flat_id: string
          membership_id: string
          membership_type: string
          message: string
          success: boolean
        }[]
      }
      admin_activate_campaign: {
        Args: { p_campaign_id: string }
        Returns: Json
      }
      admin_approve_event: { Args: { p_event_id: string }; Returns: Json }
      admin_approve_registration: {
        Args: { p_registration_id: string }
        Returns: Json
      }
      admin_approve_sponsorship: {
        Args: { p_sponsorship_id: string }
        Returns: Json
      }
      admin_cancel_event: {
        Args: { p_event_id: string; p_reason: string }
        Returns: Json
      }
      admin_close_campaign: { Args: { p_campaign_id: string }; Returns: Json }
      admin_mark_volunteer_attendance: {
        Args: { p_assignment_id: string; p_attendance: string }
        Returns: Json
      }
      admin_publish_event: { Args: { p_event_id: string }; Returns: Json }
      admin_reject_donation: {
        Args: { p_donation_id: string; p_reason: string }
        Returns: Json
      }
      admin_reject_registration: {
        Args: { p_reason: string; p_registration_id: string }
        Returns: Json
      }
      admin_reject_sponsor_contribution: {
        Args: { p_contribution_id: string; p_reason: string }
        Returns: Json
      }
      admin_reject_sponsorship: {
        Args: { p_reason: string; p_sponsorship_id: string }
        Returns: Json
      }
      admin_request_correction: {
        Args: { p_message: string; p_registration_id: string }
        Returns: Json
      }
      admin_respond_facility_booking: {
        Args: { p_action: string; p_booking_id: string; p_reason: string }
        Returns: Json
      }
      admin_verify_donation: { Args: { p_donation_id: string }; Returns: Json }
      admin_verify_sponsor_contribution: {
        Args: { p_contribution_id: string }
        Returns: Json
      }
      book_facility: {
        Args: {
          p_booking_date: string
          p_end_time: string
          p_facility_id: string
          p_flat_id: string
          p_participant_count: number
          p_purpose: string
          p_start_time: string
        }
        Returns: Json
      }
      cancel_event_registration: {
        Args: { p_registration_id: string }
        Returns: Json
      }
      cancel_facility_booking: {
        Args: { p_booking_id: string; p_reason: string }
        Returns: Json
      }
      cancel_visitor_invitation: {
        Args: { p_invitation_id: string }
        Returns: Json
      }
      cancel_volunteer_assignment: {
        Args: { p_assignment_id: string }
        Returns: Json
      }
      create_complaint: {
        Args: {
          p_category: string
          p_description: string
          p_facility_id: string
          p_flat_id: string
          p_location_detail: string
          p_location_type: string
          p_priority: string
          p_title: string
        }
        Returns: Json
      }
      create_visitor_invitation: {
        Args: {
          p_company: string
          p_expected_date: string
          p_expected_time: string
          p_flat_id: string
          p_name: string
          p_phone: string
          p_purpose: string
          p_vehicle_number: string
          p_vehicle_type: string
          p_visitor_type: string
        }
        Returns: Json
      }
      gate_check_in_visitor: {
        Args: { p_gate_id: string; p_invitation_id: string; p_notes: string }
        Returns: Json
      }
      gate_check_out_visitor: {
        Args: { p_gate_id: string; p_notes: string; p_visit_id: string }
        Returns: Json
      }
      gate_request_walkin_entry: {
        Args: {
          p_company: string
          p_flat_id: string
          p_gate_id: string
          p_name: string
          p_phone: string
          p_purpose: string
          p_vehicle_number: string
          p_visitor_type: string
        }
        Returns: Json
      }
      get_communication_summary: { Args: never; Returns: Json }
      get_facility_and_complaint_summary: { Args: never; Returns: Json }
      get_finance_summary: { Args: never; Returns: Json }
      get_flat_members: {
        Args: { p_flat_id: string }
        Returns: {
          access_status: string
          display_name: string
          member_id: string
          relationship: string
        }[]
      }
      get_flat_owner: {
        Args: { p_flat_id: string }
        Returns: {
          owner_email: string
          owner_registered: boolean
        }[]
      }
      get_gate_summary: { Args: never; Returns: Json }
      get_masked_flat_members: { Args: { p_flat_id: string }; Returns: Json }
      get_sponsor_summary: { Args: never; Returns: Json }
      get_unread_notification_count: { Args: never; Returns: number }
      get_volunteer_summary: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_communication_admin: { Args: never; Returns: boolean }
      is_event_admin: { Args: never; Returns: boolean }
      is_facility_or_helpdesk_admin: { Args: never; Returns: boolean }
      is_finance_admin: { Args: never; Returns: boolean }
      is_flat_member: {
        Args: { _flat_id: string; _user_id: string }
        Returns: boolean
      }
      is_flat_owner: {
        Args: { _flat_id: string; _user_id: string }
        Returns: boolean
      }
      is_security_or_admin: { Args: never; Returns: boolean }
      is_sponsor_admin: { Args: never; Returns: boolean }
      is_volunteer_admin: { Args: never; Returns: boolean }
      mark_all_notifications_read: { Args: never; Returns: Json }
      publish_announcement: {
        Args: { p_announcement_id: string }
        Returns: Json
      }
      register_for_event: {
        Args: {
          p_event_id: string
          p_flat_id: string
          p_flat_member_id: string
          p_notes: string
          p_participant_email: string
          p_participant_mobile: string
          p_participant_name: string
          p_participant_type: string
          p_quantity: number
        }
        Returns: Json
      }
      resident_respond_complaint_resolution: {
        Args: { p_action: string; p_complaint_id: string; p_reason: string }
        Returns: Json
      }
      resident_respond_visitor_request: {
        Args: { p_invitation_id: string; p_reason: string; p_response: string }
        Returns: Json
      }
      resolve_access: {
        Args: never
        Returns: {
          flat_id: string
          membership_id: string
          membership_status: string
          membership_type: string
          relationship: string
          role_name: string
        }[]
      }
      resolve_owner_access: {
        Args: { p_flat_id: string }
        Returns: {
          access_state: string
          flat_id: string
          registration_id: string
        }[]
      }
      search_flats: {
        Args: { p_query: string }
        Returns: {
          bhk: string
          flat_id: string
          flat_number: string
          owner_registered: boolean
        }[]
      }
      signup_volunteer: {
        Args: {
          p_flat_id: string
          p_notes: string
          p_opportunity_id: string
          p_volunteer_email: string
          p_volunteer_mobile: string
          p_volunteer_name: string
        }
        Returns: Json
      }
      submit_donation: {
        Args: {
          p_amount: number
          p_campaign_id: string
          p_donor_email: string
          p_donor_mobile: string
          p_donor_name: string
          p_flat_id: string
          p_notes: string
          p_payment_method: string
          p_payment_reference: string
        }
        Returns: Json
      }
      submit_sponsor_application: {
        Args: {
          p_amount: number
          p_campaign_id: string
          p_contact_name: string
          p_contribution_type: string
          p_description: string
          p_email: string
          p_event_id: string
          p_in_kind_description: string
          p_in_kind_estimated_value: number
          p_in_kind_quantity: number
          p_in_kind_unit: string
          p_payment_method: string
          p_payment_reference: string
          p_phone: string
          p_sponsor_name: string
          p_sponsor_type: string
          p_tier_id: string
          p_website: string
        }
        Returns: Json
      }
      update_complaint_status: {
        Args: {
          p_assigned_team: string
          p_assigned_to: string
          p_complaint_id: string
          p_resolution_summary: string
          p_status: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
