// Supabase Edge Function: send push notifications via Expo Push API
// Invoke with POST body: { "notification_id": "uuid" }
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (set by Supabase)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CHUNK_SIZE = 100;

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  target_type: 'all' | 'user';
  target_user_id: string | null;
  route: string | null;
  type: string | null;
}

interface PushTokenRow {
  expo_push_token: string;
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  channelId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const body = await req.json().catch(() => ({}));
    // Accept direct notification_id or Supabase webhook payload (record.id)
    const notificationId =
      (body?.notification_id as string) || (body?.record?.id as string) || undefined;
    if (!notificationId) {
      return json({ error: 'notification_id or record.id required' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('id, title, body, target_type, target_user_id, route, type')
      .eq('id', notificationId)
      .single();

    if (notifError || !notification) {
      return json({ error: 'Notification not found' }, 404);
    }

    const n = notification as NotificationRow;
    let query = supabase.from('push_tokens').select('expo_push_token');
    if (n.target_type === 'user' && n.target_user_id) {
      query = query.eq('user_id', n.target_user_id);
    }
    const { data: tokens, error: tokensError } = await query;

    if (tokensError) {
      console.error('push_tokens fetch error', tokensError);
      return json({ error: 'Failed to fetch push tokens' }, 500);
    }

    const tokenList = (tokens ?? []) as PushTokenRow[];
    const expoTokens = tokenList
      .map((t) => t.expo_push_token)
      .filter((t) => t && t.startsWith('ExponentPushToken'));

    if (expoTokens.length === 0) {
      return json({ sent: 0, message: 'No valid push tokens' }, 200);
    }

    const messages: ExpoMessage[] = expoTokens.map((to) => ({
      to,
      title: n.title,
      body: n.body,
      data: {
        route: n.route ?? undefined,
        notificationId: n.id,
      },
      sound: 'default',
      channelId: 'default',
    }));

    let totalSent = 0;
    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
      const chunk = messages.slice(i, i + CHUNK_SIZE);
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Expo Push API error', res.status, errText);
        return json({ error: 'Expo push failed', detail: errText }, 502);
      }
      const result = await res.json();
      const tickets = result?.data ?? [];
      totalSent += tickets.filter((t: { status?: string }) => t.status === 'ok').length;
    }

    return json({ sent: totalSent, tokens: expoTokens.length }, 200);
  } catch (err) {
    console.error('send-push error', err);
    return json({ error: String(err) }, 500);
  }
});

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
