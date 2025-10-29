import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { type LucideIcon } from 'lucide-react-native';
import { getIconComponent } from '@/lib/iconMapper';
import { colors } from '@/constants/theme';

type DiscountServiceRow = Database['public']['Tables']['discount_services']['Row'];
type DiscountCodeRow = Database['public']['Tables']['discount_codes']['Row'];

function rgbaFromHex(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  const r = (int >> 16) & 0xff;
  const g = (int >> 8) & 0xff;
  const b = int & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type DiscountCode = {
  code: string;
  description: string;
};

export type DiscountService = {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: LucideIcon;
  color: string;
  gradient: string;
  displayOrder: number;
  codes?: DiscountCode[];
};

export function useDiscountServices() {
  const [services, setServices] = useState<DiscountService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();

    const servicesChannel = supabase
      .channel('discount_services_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discount_services',
        },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    const codesChannel = supabase
      .channel('discount_codes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discount_codes',
        },
        () => {
          fetchServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(codesChannel);
    };
  }, []);

  async function fetchServices() {
    try {
      setError(null);

      const { data: servicesData, error: servicesError } = await supabase
        .from('discount_services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (servicesError) {
        throw servicesError;
      }

      const { data: codesData, error: codesError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (codesError) {
        throw codesError;
      }

      const codesByServiceId = (codesData || []).reduce((acc, code: DiscountCodeRow) => {
        if (!acc[code.service_id]) {
          acc[code.service_id] = [];
        }
        acc[code.service_id].push({
          code: code.code,
          description: code.description,
        });
        return acc;
      }, {} as Record<string, DiscountCode[]>);

      const mappedServices: DiscountService[] = (servicesData || []).map(
        (service: DiscountServiceRow, index: number) => {
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
            codes: codesByServiceId[service.id] || undefined,
          };
        }
      );

      setServices(mappedServices);
    } catch (err) {
      console.error('Error fetching discount services:', err);
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }

  return { services, loading, error, refetch: fetchServices };
}
