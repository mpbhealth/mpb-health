import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { type LucideIcon } from 'lucide-react-native';
import { getIconComponent } from '@/lib/iconMapper';
import { colors } from '@/constants/theme';

type LabsTestingRow = Database['public']['Tables']['labs_testing']['Row'];

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type LabsTestingService = {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  displayOrder: number;
};

export function useLabsTesting() {
  const [services, setServices] = useState<LabsTestingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();

    const channel = supabase
      .channel('labs_testing_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'labs_testing',
        },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchServices() {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('labs_testing')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const mappedServices: LabsTestingService[] = (data || []).map((service: LabsTestingRow, index: number) => {
        const isBlue = index % 2 === 0;
        const color = isBlue ? colors.primary.main : colors.secondary.main;
        const gradient = rgbaFromHex(color, 0.15);

        return {
          id: service.id,
          title: service.title,
          description: service.description,
          url: service.url,
          icon: getIconComponent(service.icon_name),
          color,
          gradient,
          displayOrder: service.display_order,
        };
      });

      setServices(mappedServices);
    } catch (err) {
      console.error('Error fetching labs testing services:', err);
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }

  return { services, loading, error, refetch: fetchServices };
}
