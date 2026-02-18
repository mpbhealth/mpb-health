/**
 * Video Player Screen – enterprise layout, safe area, accessibility, and error handling.
 * Uses expo-av for native video; consider migrating to expo-video when targeting SDK 54+.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Share as NativeShare,
  Modal,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Calendar,
  Share2,
  ThumbsUp,
  Bookmark,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Maximize2,
  X,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Video,
  ResizeMode,
  AVPlaybackStatus,
  AVPlaybackStatusSuccess,
} from 'expo-av';

import { BackButton } from '@/components/common/BackButton';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { SmartText } from '@/components/common/SmartText';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { useResponsive } from '@/hooks/useResponsive';
import { supabase } from '@/lib/supabase';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles, MIN_TOUCH_TARGET } from '@/utils/scaling';

interface VideoData {
  video_url: string;
  video_title: string;
  video_description: string;
  published_date_time: string;
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|mov|m4v)$/i.test(url || '');
}

function formatVideoDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function VideoPlayerScreen() {
  const router = useRouter();
  const { url } = useLocalSearchParams<{ url: string }>();
  const { headerPaddingTop, scrollContentPaddingBottom, insets } = useSafeHeaderPadding();
  const { isTablet } = useResponsive();

  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAndroidFullscreen, setShowAndroidFullscreen] = useState(false);
  const videoRef = useRef<Video | null>(null);
  const exitingFullscreenRef = useRef(false);

  const fetchVideo = useCallback(async () => {
    if (!url) {
      setError('No video specified');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, err } = await supabase
        .from('videos')
        .select('*')
        .eq('video_url', url)
        .single();
      if (err) throw err;
      setVideo(data);
    } catch {
      setError('Unable to load video details');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    const s = status as AVPlaybackStatusSuccess;
    setIsPlaying(s.isPlaying);
  }, []);

  const handleShare = useCallback(async () => {
    if (!video) return;
    try {
      await NativeShare.share({
        title: video.video_title,
        message: `${video.video_title}\n\n${video.video_description}\n\nWatch here: ${video.video_url}`,
        url: video.video_url,
      });
    } catch {
      // User cancelled or share failed
    }
  }, [video]);

  const handlePlayPause = useCallback(async () => {
    const ref = videoRef.current;
    if (!ref) return;
    try {
      const status = await ref.getStatusAsync();
      if (status.isLoaded) {
        status.isPlaying ? await ref.pauseAsync() : await ref.playAsync();
      }
    } catch {
      // ignore
    }
  }, []);

  const handleFullscreenPress = useCallback(async () => {
    if (Platform.OS === 'ios') {
      try {
        await videoRef.current?.presentFullscreenPlayer();
      } catch {
        // ignore
      }
      return;
    }
    if (Platform.OS === 'android') {
      setShowAndroidFullscreen(true);
    }
  }, []);

  const handleFullscreenUpdate = useCallback((event: { fullscreenUpdate: number }) => {
    const { fullscreenUpdate } = event;
    if (fullscreenUpdate === 2 || fullscreenUpdate === 3) {
      exitingFullscreenRef.current = true;
      setVideoLoading(false);
      setTimeout(() => {
        exitingFullscreenRef.current = false;
      }, 800);
    }
  }, []);

  const handleVideoLoadStart = useCallback(() => {
    if (exitingFullscreenRef.current) return;
    setVideoLoading(true);
  }, []);

  const handleVideoLoad = useCallback(() => {
    setVideoLoading(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerContent}>
            <SmartText variant="h3" style={styles.headerTitle}>Video Player</SmartText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingIndicator />
          <SmartText variant="body2" style={styles.loadingText}>Loading video...</SmartText>
        </View>
      </View>
    );
  }

  if (error || !video) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerContent}>
            <SmartText variant="h3" style={styles.headerTitle}>Video Player</SmartText>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={moderateScale(48)} color={colors.status.error} />
          <SmartText variant="h3" style={styles.errorTitle}>Video Unavailable</SmartText>
          <SmartText variant="body1" style={styles.errorText}>
            {error || 'Video not found'}
          </SmartText>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchVideo}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Retry loading video"
            >
              <RefreshCw size={moderateScale(20)} color={colors.background.default} />
              <SmartText variant="body1" style={styles.retryButtonText}>Retry</SmartText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.back()}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <SmartText variant="body1" style={styles.secondaryButtonText}>Go Back</SmartText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const directVideo = isDirectVideoUrl(video.video_url);

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.delay(100)}
        style={[styles.header, { paddingTop: headerPaddingTop }]}
      >
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerContent}>
          <SmartText variant="h3" style={styles.headerTitle} numberOfLines={1}>
            Video Player
          </SmartText>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollContentPaddingBottom }]}
      >
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={[styles.videoWrapper, isTablet && styles.videoWrapperTablet]}
        >
          <View style={styles.videoContainer}>
            {directVideo ? (
              <>
                <Video
                  ref={(ref) => { videoRef.current = ref; }}
                  style={styles.video}
                  source={{ uri: video.video_url }}
                  useNativeControls
                  shouldPlay
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping={false}
                  onLoadStart={handleVideoLoadStart}
                  onLoad={handleVideoLoad}
                  onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                  onFullscreenUpdate={handleFullscreenUpdate}
                />
                {videoLoading && (
                  <View style={styles.loadingOverlay}>
                    <LoadingIndicator />
                  </View>
                )}
                {Platform.OS === 'ios' && !videoLoading && (
                  <TouchableOpacity
                    style={styles.playPauseOverlay}
                    onPress={handlePlayPause}
                    activeOpacity={0.9}
                    accessibilityRole="button"
                    accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause size={moderateScale(48)} color="#fff" strokeWidth={2} />
                    ) : (
                      <Play size={moderateScale(48)} color="#fff" fill="#fff" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.fullscreenButton}
                  onPress={handleFullscreenPress}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Enter fullscreen"
                >
                  <Maximize2 size={moderateScale(22)} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <WebViewContainer
                url={video.video_url}
                javaScriptEnabled
                onError={() => setError('Failed to load video')}
              />
            )}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(300)}
          style={[styles.detailsWrapper, isTablet && styles.detailsWrapperTablet]}
        >
          <View style={styles.detailsContainer}>
            <SmartText variant="h3" style={styles.title} numberOfLines={3}>
              {video.video_title}
            </SmartText>

            <View style={styles.metaRow}>
              <View style={styles.dateRow}>
                <Calendar size={moderateScale(16)} color={colors.text.secondary} />
                <SmartText variant="caption" style={styles.date}>
                  {formatVideoDate(video.published_date_time)}
                </SmartText>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setIsLiked((v) => !v)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
                  accessibilityState={{ selected: isLiked }}
                >
                  <ThumbsUp
                    size={moderateScale(20)}
                    color={isLiked ? colors.primary.main : colors.text.secondary}
                    fill={isLiked ? colors.primary.main : 'none'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setIsBookmarked((v) => !v)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                  accessibilityState={{ selected: isBookmarked }}
                >
                  <Bookmark
                    size={moderateScale(20)}
                    color={isBookmarked ? colors.primary.main : colors.text.secondary}
                    fill={isBookmarked ? colors.primary.main : 'none'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShare}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Share video"
                >
                  <Share2 size={moderateScale(20)} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />
            <SmartText variant="body1" style={styles.description}>
              {video.video_description}
            </SmartText>
          </View>
        </Animated.View>
      </ScrollView>

      {Platform.OS === 'android' && directVideo && (
        <Modal
          visible={showAndroidFullscreen}
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setShowAndroidFullscreen(false)}
        >
          <View style={styles.androidFullscreenContainer}>
            <StatusBar hidden />
            <Video
              style={StyleSheet.absoluteFill}
              source={{ uri: video.video_url }}
              useNativeControls
              shouldPlay
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
              onError={() => setShowAndroidFullscreen(false)}
            />
            <TouchableOpacity
              style={[styles.androidFullscreenClose, { top: insets.top + responsiveSize.sm }]}
              onPress={() => setShowAndroidFullscreen(false)}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Exit fullscreen"
            >
              <X size={moderateScale(28)} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  header: {
    backgroundColor: colors.background.default,
    paddingHorizontal: responsiveSize.lg,
    paddingBottom: responsiveSize.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  headerContent: {
    flex: 1,
    marginLeft: responsiveSize.xs,
    minWidth: 0,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: responsiveSize.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: responsiveSize.md,
  },
  loadingText: {
    color: colors.text.secondary,
  },
  videoWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  videoWrapperTablet: {
    maxWidth: 900,
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.background.default,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playPauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenButton: {
    position: 'absolute',
    top: responsiveSize.sm,
    right: responsiveSize.sm,
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidFullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  androidFullscreenClose: {
    position: 'absolute',
    top: responsiveSize.lg,
    right: responsiveSize.lg,
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsWrapper: {
    marginHorizontal: responsiveSize.lg,
    marginTop: responsiveSize.lg,
  },
  detailsWrapperTablet: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  detailsContainer: {
    padding: responsiveSize.lg,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    ...(Platform.OS === 'ios' ? platformStyles.shadowSm : {}),
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: responsiveSize.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: responsiveSize.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs,
  },
  date: {
    color: colors.text.secondary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs,
  },
  actionButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary.main}08`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: responsiveSize.md,
  },
  description: {
    ...typography.body1,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSize.xl,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: responsiveSize.sm,
  },
  errorText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: responsiveSize.xl,
  },
  errorActions: {
    flexDirection: 'row',
    gap: responsiveSize.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.sm,
    backgroundColor: colors.primary.main,
    paddingHorizontal: responsiveSize.lg,
    paddingVertical: responsiveSize.sm,
    borderRadius: borderRadius.lg,
    minHeight: MIN_TOUCH_TARGET,
  },
  retryButtonText: {
    ...typography.body1,
    color: colors.background.default,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: responsiveSize.lg,
    paddingVertical: responsiveSize.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
});
