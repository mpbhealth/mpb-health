import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { type LucideIcon } from 'lucide-react-native';
import { getIconComponent } from '@/lib/iconMapper';
import { colors } from '@/constants/theme';

type CareServiceRow = Database['public']['Tables']['care_services']['Row'];

const SECOND_OPINION_PRODUCT_IDS = ['43957', '44036'];

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type CareService = {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  serviceKey: string;
  displayOrder: number;
};

export function useCareServices(userProductId?: string | null) {
  const [services, setServices] = useState<CareService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();

    const channel = supabase
      .channel('care_services_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'care_services',
        },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProductId]);

  async function fetchServices() {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('care_services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const filteredData = (data || []).filter((service: CareServiceRow) => {
        if (service.service_key === 'second-md') {
          return userProductId && SECOND_OPINION_PRODUCT_IDS.includes(userProductId);
        }
        return true;
      });

      const mappedServices: CareService[] = filteredData.map((service: CareServiceRow, index: number) => {
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
          serviceKey: service.service_key,
          displayOrder: service.display_order,
        };
      });

      setServices(mappedServices);
    } catch (err) {
      console.error('Error fetching care services:', err);
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }

  return { services, loading, error, refetch: fetchServices };
}
