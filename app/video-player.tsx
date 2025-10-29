// VideoPlayerScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share as NativeShare,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import {
  Calendar,
  Share2,
  ThumbsUp,
  Bookmark,
  AlertCircle,
} from 'lucide-react-native';
import { colors, shadows, typography, spacing, borderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Video,
  ResizeMode,
  AVPlaybackStatus,
  AVPlaybackStatusSuccess,
} from 'expo-av';

interface VideoData {
  video_url: string;
  video_title: string;
  video_description: string;
  published_date_time: string;
}

export default function VideoPlayerScreen() {
  const router = useRouter();
  const { url } = useLocalSearchParams<{ url: string }>();
  const insets = useSafeAreaInsets();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<Video | null>(null);
  const { width } = Dimensions.get('window');

  // Fetch video metadata
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('video_url', url)
          .single();
        if (error) throw error;
        setVideo(data);
      } catch {
        setError('Unable to load video details');
      } finally {
        setLoading(false);
      }
    })();
  }, [url]);

  // Update playing state
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    const success = status as AVPlaybackStatusSuccess;
    setIsPlaying(success.isPlaying);
  };

  const isDirectVideo = (u: string) => /\.(mp4|mov|m4v)$/i.test(u);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const handleShare = async () => {
    if (!video) return;
    try {
      await NativeShare.share({
        title: video.video_title,
        message: `${video.video_title}\n\n${video.video_description}\n\nWatch here: ${video.video_url}`,
        url: video.video_url,
      });
    } catch {
      // ignore
    }
  };

  if (loading) return <LoadingIndicator />;
  if (error || !video) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Video Player</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={colors.status.error} />
          <Text style={styles.errorTitle}>Video Unavailable</Text>
          <Text style={styles.errorText}>{error || 'Video not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(100)}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Video Player</Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={[styles.videoContainer, { width }]}
        >
          {isDirectVideo(video.video_url) ? (
            <>
              <Video
                ref={ref => { videoRef.current = ref; }}
                style={styles.video}
                source={{ uri: video.video_url }}
                useNativeControls={Platform.OS === 'android'}
                shouldPlay
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                onLoadStart={() => setVideoLoading(true)}
                onLoad={() => setVideoLoading(false)}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onFullscreenUpdate={({ fullscreenUpdate }) => {
                  // 3 === FULLSCREEN_UPDATE_PLAYER_DID_DISMISS
                  if (fullscreenUpdate === 3) {
                    setVideoLoading(false);
                  }
                }}
              />

              {videoLoading && (
                <View style={styles.loadingOverlay}>
                  <LoadingIndicator />
                </View>
              )}

              {Platform.OS === 'ios' && !videoLoading && (
                <TouchableOpacity
                  style={styles.playPauseOverlay}
                  onPress={async () => {
                    const ref = videoRef.current;
                    if (!ref) return;
                    const status = await ref.getStatusAsync();
                    if (status.isLoaded) {
                      status.isPlaying ? await ref.pauseAsync() : await ref.playAsync();
                    }
                  }}
                >
                  <Text style={styles.playPauseText}>
                    {isPlaying ? '⏸' : '▶️'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <WebViewContainer
              url={video.video_url}
              javaScriptEnabled
              onError={() => setError('Failed to load video')}
            />
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)} style={styles.detailsContainer}>
          <Text style={styles.title}>{video.video_title}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.dateContainer}>
              <Calendar size={16} color={colors.text.secondary} />
              <Text style={styles.date}>{formatDate(video.published_date_time)}</Text>
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsLiked(v => !v)}
              >
                <ThumbsUp
                  size={20}
                  color={isLiked ? colors.primary.main : colors.text.secondary}
                  fill={isLiked ? colors.primary.main : 'none'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsBookmarked(v => !v)}
              >
                <Bookmark
                  size={20}
                  color={isBookmarked ? colors.primary.main : colors.text.secondary}
                  fill={isBookmarked ? colors.primary.main : 'none'}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <Share2 size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.description}>{video.video_description}</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.paper },
  header: {
    backgroundColor: colors.background.default,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  headerContent: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.h3, color: colors.text.primary },
  content: { flex: 1 },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.background.default,
    ...shadows.md,
  },
  video: { width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${colors.background.paper}80`,
  },
  playPauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseText: {
    fontSize: 32,
    color: '#fff',
  },
  detailsContainer: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  title: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.md },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  date: { ...typography.caption, color: colors.text.secondary, marginLeft: spacing.xs },
  actionsContainer: { flexDirection: 'row', alignItems: 'center' },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary.main}08`,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: spacing.md,
  },
  description: { ...typography.body1, color: colors.text.secondary, lineHeight: 24 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    ...typography.body1,
    color: colors.background.default,
    fontWeight: '600',
  },
});
