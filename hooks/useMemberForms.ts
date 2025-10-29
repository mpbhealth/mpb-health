import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { type LucideIcon } from 'lucide-react-native';
import { getIconComponent } from '@/lib/iconMapper';
import { colors } from '@/constants/theme';

type MemberFormRow = Database['public']['Tables']['member_forms']['Row'];

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type MemberForm = {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  badge?: string;
  displayOrder: number;
};

export function useMemberForms() {
  const [forms, setForms] = useState<MemberForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();

    const channel = supabase
      .channel('member_forms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_forms',
        },
        () => {
          fetchForms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchForms() {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('member_forms')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const mappedForms: MemberForm[] = (data || []).map((form: MemberFormRow, index: number) => {
        const isBlue = index % 2 === 0;
        const color = isBlue ? colors.primary.main : colors.secondary.main;
        const gradient = rgbaFromHex(color, 0.15);

        return {
          id: form.id,
          title: form.title,
          description: form.description,
          url: form.url,
          icon: getIconComponent(form.icon_name),
          color,
          gradient,
          badge: form.badge || undefined,
          displayOrder: form.display_order,
        };
      });

      setForms(mappedForms);
    } catch (err) {
      console.error('Error fetching member forms:', err);
      setError(err instanceof Error ? err.message : 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  }

  return { forms, loading, error, refetch: fetchForms };
}
