import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { type LucideIcon } from 'lucide-react-native';
import { getIconComponent } from '@/lib/iconMapper';
import { colors } from '@/constants/theme';

type CareServiceRow = Database['public']['Tables']['care_services']['Row'];

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

/** Pass a single product id or an array (e.g. [normalized, raw] so both 47182 and 42464 match). */
export function useCareServices(userProductId?: string | string[] | null) {
  const [services, setServices] = useState<CareService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ids = Array.isArray(userProductId)
    ? userProductId.map((id) => String(id).trim()).filter(Boolean)
    : userProductId != null
      ? [String(userProductId).trim()]
      : [];

  const idKey = ids.length ? ids.slice().sort().join(',') : '';

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
  }, [idKey]);

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

      const userPids = ids.length > 0 ? ids : null;

      const filteredData = (data || []).filter((service: CareServiceRow) => {
        const productIds = service.product_ids;
        if (!productIds || productIds.length === 0) {
          return true;
        }
        if (!userPids) return false;
        return productIds.some((id) => userPids.includes(String(id).trim()));
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
