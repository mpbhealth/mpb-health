import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'payment_declined' | 'new_member';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  route?: string;
  type?: NotificationType;
}

const LIMIT = 100;

export function useNotifications() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const userCreatedAt = session?.user?.created_at ?? null;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('notifications')
        .select('id, title, body, route, type, target_type, created_at')
        .or(`target_type.eq.all,target_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(LIMIT);

      const { data: rows, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Hide broadcast notifications that were created before the user's account
      const filtered = (rows ?? []).filter((r) => {
        if (r.target_type === 'all' && userCreatedAt) {
          return new Date(r.created_at) >= new Date(userCreatedAt);
        }
        return true;
      });

      const idList = filtered.map((r) => r.id);
      if (idList.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      const { data: reads } = await supabase
        .from('notification_reads')
        .select('notification_id, read_at')
        .eq('user_id', userId)
        .in('notification_id', idList);

      const readSet = new Set((reads ?? []).map((r) => r.notification_id));

      setNotifications(
        filtered.map((r) => ({
          id: r.id,
          title: r.title,
          message: r.body,
          date: r.created_at,
          read: readSet.has(r.id),
          route: r.route ?? undefined,
          type: (r.type as NotificationType) ?? undefined,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [userId, userCreatedAt]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      await supabase.from('notification_reads').upsert(
        {
          notification_id: notificationId,
          user_id: userId,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'notification_id,user_id' }
      );
    },
    [userId]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const rows = unread.map((n) => ({
      notification_id: n.id,
      user_id: userId,
      read_at: new Date().toISOString(),
    }));
    await supabase
      .from('notification_reads')
      .upsert(rows, { onConflict: 'notification_id,user_id' });
  }, [userId, notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, error, refetch: fetchNotifications, markAsRead, markAllAsRead, unreadCount };
}
