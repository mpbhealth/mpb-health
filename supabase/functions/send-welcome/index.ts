// Supabase Edge Function: create & send welcome notification for new members
// Invoke with POST body: { "user_id": "uuid" }
// Uses service role key — bypasses RLS

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return json(null, 204);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body?.user_id as string | undefined;
    if (!userId) {
      return json({ error: 'user_id is required' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if welcome notification already exists for this user
    const { data: existing, error: checkError } = await supabase
      .from('notifications')
      .select('id')
      .eq('target_user_id', userId)
      .eq('type', 'new_member')
      .limit(1);

    if (checkError) {
      console.error('Welcome check failed', checkError);
      return json({ error: 'Failed to check existing notification' }, 500);
    }

    if (existing && existing.length > 0) {
      return json({ skipped: true, message: 'Welcome notification already exists' }, 200);
    }

    // Insert the welcome notification
    const { data: inserted, error: insertError } = await supabase
      .from('notifications')
      .insert({
        title: 'Welcome to MPB Health! 🎉',
        body: "We're excited to have you as a member. Tap to get started!",
        type: 'new_member',
        target_type: 'user',
        target_user_id: userId,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      console.error('Welcome insert failed', insertError);
      return json({ error: 'Failed to create notification' }, 500);
    }

    // Fetch push tokens for this user
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('user_id', userId);

    const expoTokens = (tokens ?? [])
      .map((t: { expo_push_token: string }) => t.expo_push_token)
      .filter((t: string) => t && t.startsWith('ExponentPushToken'));

    if (expoTokens.length === 0) {
      return json({ created: true, sent: 0, message: 'No push tokens found' }, 200);
    }

    // Send push via Expo
    const messages = expoTokens.map((to: string) => ({
      to,
      title: 'Welcome to MPB Health! 🎉',
      body: "We're excited to have you as a member. Tap to get started!",
      data: { notificationId: inserted.id },
      sound: 'default' as const,
      channelId: 'default',
    }));

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Expo Push API error', res.status, errText);
      return json({ created: true, sent: 0, error: 'Push delivery failed' }, 502);
    }

    const result = await res.json();
    const sent = (result?.data ?? []).filter((t: { status?: string }) => t.status === 'ok').length;

    return json({ created: true, sent, tokens: expoTokens.length }, 200);
  } catch (err) {
    console.error('send-welcome error', err);
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, content-type',
    },
  });
}
