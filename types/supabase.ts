export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          member_id: string
          first_name: string | null
          last_name: string | null
          product_id: string
          product_label: string | null
          product_benefit: string | null
          agent_id: string | null
          dob: string | null
          email: string | null
          is_primary: boolean | null
          relationship: string | null
          primary_id: string | null
          active_date: string | null
          inactive_date: string | null
          inactive_reason: string | null
          is_active: boolean | null
          created_date: string | null
        }
        Insert: {
          member_id: string
          first_name?: string | null
          last_name?: string | null
          product_id: string
          product_label?: string | null
          product_benefit?: string | null
          agent_id?: string | null
          dob?: string | null
          email?: string | null
          is_primary?: boolean | null
          relationship?: string | null
          primary_id?: string | null
          active_date?: string | null
          inactive_date?: string | null
          inactive_reason?: string | null
          is_active?: boolean | null
          created_date?: string | null
        }
        Update: {
          member_id?: string
          first_name?: string | null
          last_name?: string | null
          product_id?: string
          product_label?: string | null
          product_benefit?: string | null
          agent_id?: string | null
          dob?: string | null
          email?: string | null
          is_primary?: boolean | null
          relationship?: string | null
          primary_id?: string | null
          active_date?: string | null
          inactive_date?: string | null
          inactive_reason?: string | null
          is_active?: boolean | null
          created_date?: string | null
        }
      }
      users: {
        Row: {
          id: string
          member_id: string
          first_name: string | null
          last_name: string | null
          product_id: string
          email: string | null
          product_label: string | null
          product_benefit: string | null
          agent_id: string | null
          dob: string | null
          is_primary: boolean | null
          relationship: string | null
          primary_id: string | null
          active_date: string | null
          inactive_date: string | null
          inactive_reason: string | null
          is_active: boolean | null
          created_date: string | null
        }
        Insert: {
          id: string
          member_id: string
          first_name?: string | null
          last_name?: string | null
          product_id: string
          email?: string | null
          product_label?: string | null
          product_benefit?: string | null
          agent_id?: string | null
          dob?: string | null
          is_primary?: boolean | null
          relationship?: string | null
          primary_id?: string | null
          active_date?: string | null
          inactive_date?: string | null
          inactive_reason?: string | null
          is_active?: boolean | null
          created_date?: string | null
        }
        Update: {
          id?: string
          member_id?: string
          first_name?: string | null
          last_name?: string | null
          product_id?: string
          email?: string | null
          product_label?: string | null
          product_benefit?: string | null
          agent_id?: string | null
          dob?: string | null
          is_primary?: boolean | null
          relationship?: string | null
          primary_id?: string | null
          active_date?: string | null
          inactive_date?: string | null
          inactive_reason?: string | null
          is_active?: boolean | null
          created_date?: string | null
        }
      }
      advisors: {
        Row: {
          agent_id: string
          first_name: string
          last_name: string
          phone: string
          email: string
        }
        Insert: {
          agent_id: string
          first_name: string
          last_name: string
          phone: string
          email: string
        }
        Update: {
          agent_id?: string
          first_name?: string
          last_name?: string
          phone?: string
          email?: string
        }
      }
      videos: {
        Row: {
          video_url: string
          video_title: string
          video_description: string | null
          published_date_time: string | null
          featured: boolean | null
        }
        Insert: {
          video_url: string
          video_title: string
          video_description?: string | null
          published_date_time?: string | null
          featured?: boolean | null
        }
        Update: {
          video_url?: string
          video_title?: string
          video_description?: string | null
          published_date_time?: string | null
          featured?: boolean | null
        }
      }
      products: {
        Row: {
          id: string
          product_name: string
        }
        Insert: {
          id: string
          product_name: string
        }
        Update: {
          id?: string
          product_name?: string
        }
      }
      employees: {
        Row: {
          id: string
          name: string
          email: string
          created_at: string | null
          role: string
        }
        Insert: {
          id: string
          name: string
          email: string
          created_at?: string | null
          role?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          created_at?: string | null
          role?: string
        }
      }
      member_forms: {
        Row: {
          id: string
          title: string
          description: string
          url: string
          icon_name: string
          badge: string | null
          display_order: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          url: string
          icon_name?: string
          badge?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          url?: string
          icon_name?: string
          badge?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      labs_testing: {
        Row: {
          id: string
          title: string
          description: string
          url: string
          icon_name: string
          display_order: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          url: string
          icon_name?: string
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          url?: string
          icon_name?: string
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      care_services: {
        Row: {
          id: string
          title: string
          description: string
          url: string
          icon_name: string
          service_key: string
          product_ids: string[] | null
          display_order: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          url: string
          icon_name?: string
          service_key?: string
          product_ids?: string[] | null
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          url?: string
          icon_name?: string
          service_key?: string
          product_ids?: string[] | null
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      discount_services: {
        Row: {
          id: string
          title: string
          description: string
          url: string
          icon_name: string
          display_order: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          url: string
          icon_name?: string
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          url?: string
          icon_name?: string
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      discount_codes: {
        Row: {
          id: string
          service_id: string
          code: string
          description: string
          display_order: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          service_id: string
          code: string
          description: string
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          service_id?: string
          code?: string
          description?: string
          display_order?: number
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      api_logs: {
        Row: {
          id: string
          user_id: string
          member_id: string
          api_endpoint: string
          request_url: string
          response_status: string | null
          response_data: Json | null
          error_message: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          member_id: string
          api_endpoint: string
          request_url: string
          response_status?: string | null
          response_data?: Json | null
          error_message?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          member_id?: string
          api_endpoint?: string
          request_url?: string
          response_status?: string | null
          response_data?: Json | null
          error_message?: string | null
          created_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          title: string
          body: string
          target_type: 'all' | 'user'
          target_user_id: string | null
          route: string | null
          type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          target_type: 'all' | 'user'
          target_user_id?: string | null
          route?: string | null
          type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          target_type?: 'all' | 'user'
          target_user_id?: string | null
          route?: string | null
          type?: string | null
          created_at?: string
        }
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          user_id: string
          read_at: string
        }
        Insert: {
          id?: string
          notification_id: string
          user_id: string
          read_at?: string
        }
        Update: {
          id?: string
          notification_id?: string
          user_id?: string
          read_at?: string
        }
      }
      push_tokens: {
        Row: {
          id: string
          user_id: string
          expo_push_token: string
          device_id: string | null
          platform: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          expo_push_token: string
          device_id?: string | null
          platform?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          expo_push_token?: string
          device_id?: string | null
          platform?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
