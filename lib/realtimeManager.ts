import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

type SubscriptionCallback = () => void;

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: Map<string, Set<SubscriptionCallback>> = new Map();
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;

  subscribe(
    channelName: string,
    table: string,
    callback: SubscriptionCallback
  ): () => void {
    const key = `${channelName}_${table}`;

    if (!this.callbacks.has(key)) {
      this.callbacks.set(key, new Set());
    }
    this.callbacks.get(key)!.add(callback);

    if (!this.channels.has(key)) {
      this.createChannel(key, table);
    }

    return () => this.unsubscribe(key, callback);
  }

  private createChannel(key: string, table: string): void {
    try {
      const channel = supabase
        .channel(key)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
          },
          () => {
            const callbacks = this.callbacks.get(key);
            if (callbacks) {
              callbacks.forEach((cb) => {
                try {
                  cb();
                } catch (error) {
                  logger.error('Realtime callback error', error, { table, key });
                }
              });
            }
          }
        )
        .subscribe((status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT') => {
          if (status === 'SUBSCRIBED') {
            logger.debug('Realtime channel subscribed', { key, table });
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('Realtime channel error', undefined, { key, table });
            this.handleChannelError(key);
          } else if (status === 'TIMED_OUT') {
            logger.warn('Realtime channel timeout', { key, table });
            this.handleChannelTimeout(key);
          }
        });

      this.channels.set(key, channel);
    } catch (error) {
      logger.error('Failed to create realtime channel', error, { key, table });
    }
  }

  private unsubscribe(key: string, callback: SubscriptionCallback): void {
    const callbacks = this.callbacks.get(key);
    if (callbacks) {
      callbacks.delete(callback);

      if (callbacks.size === 0) {
        this.removeChannel(key);
      }
    }
  }

  private removeChannel(key: string): void {
    const channel = this.channels.get(key);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(key);
      this.callbacks.delete(key);
      logger.debug('Realtime channel removed', { key });
    }
  }

  private handleChannelError(key: string): void {
    this.removeChannel(key);

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    this.connectionTimeout = setTimeout(() => {
      logger.info('Attempting to reconnect realtime channel', { key });
      const callbacks = this.callbacks.get(key);
      if (callbacks && callbacks.size > 0) {
        const [table] = key.split('_').slice(1);
        this.createChannel(key, table);
      }
    }, 5000);
  }

  private handleChannelTimeout(key: string): void {
    this.handleChannelError(key);
  }

  cleanup(): void {
    this.channels.forEach((channel, key) => {
      supabase.removeChannel(channel);
      logger.debug('Cleanup: Removed realtime channel', { key });
    });
    this.channels.clear();
    this.callbacks.clear();

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
}

export const realtimeManager = new RealtimeManager();
