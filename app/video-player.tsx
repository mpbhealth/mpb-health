/**
 * Video player screen – expo-video for direct files; WebView for embed pages.
 * Playback failures stay inline (details remain visible); fetch errors use full-page state.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Share as NativeShare,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import {
  Calendar,
  Share2,
  ThumbsUp,
  Bookmark,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useEvent } from 'expo';
import { VideoView, useVideoPlayer, VideoAirPlayButton, type VideoSource } from 'expo-video';

import { BackButton } from '@/components/common/BackButton';
import { Card } from '@/components/common/Card';
import { WebViewContainer } from '@/components/common/WebViewContainer';
import { SmartText } from '@/components/common/SmartText';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { useResponsive } from '@/hooks/useResponsive';
import { supabase } from '@/lib/supabase';
import { colors, typography, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, platformStyles, MIN_TOUCH_TARGET, androidCardOutline } from '@/utils/scaling';
import { screenChrome } from '@/utils/screenChrome';
import { getUserFacingErrorMessage } from '@/utils/userFacingError';

interface VideoData {
  video_url: string;
  video_title: string;
  video_description: string;
  published_date_time: string;
}

const META_ARTIST_MAX = 180;

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|mov|m4v|webm|m3u8)(\?|$|#)/i.test(url || '') || /\/manifest\.m3u8/i.test(url || '');
}

function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|$|#)/i.test(url || '') || /\/manifest\.m3u8/i.test(url || '');
}

function truncateMetaText(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatVideoDate(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

type DirectNativeVideoProps = {
  uri: string;
  title: string;
  description: string;
  onError: () => void;
};

function DirectNativeVideo({ uri, title, description, onError }: DirectNativeVideoProps) {
  const source = useMemo((): VideoSource => {
    const hls = isHlsUrl(uri);
    const artist = description ? truncateMetaText(description, META_ARTIST_MAX) : undefined;
    return {
      uri,
      useCaching: !hls,
      metadata: {
        title: title || 'Video',
        ...(artist ? { artist } : {}),
      },
    };
  }, [uri, title, description]);

  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.play();
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const showBuffering = status === 'loading';
  const errorReportedRef = useRef(false);

  useEffect(() => {
    errorReportedRef.current = false;
  }, [uri]);

  useEffect(() => {
    if (status === 'error' && !errorReportedRef.current) {
      errorReportedRef.current = true;
      onError();
    }
  }, [status, onError]);

  return (
    <View style={styles.nativeVideoStack} accessibilityLabel="Video">
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{ enable: true, orientation: 'default' }}
        allowsPictureInPicture
        useExoShutter={Platform.OS === 'android' ? false : undefined}
      />
      {Platform.OS === 'ios' && (
        <View
          style={styles.airPlayWrap}
          importantForAccessibility="no"
          pointerEvents="box-none"
        >
          <VideoAirPlayButton
            style={styles.airPlayBtn}
            tint="#fff"
            activeTint={colors.primary.main}
            accessibilityLabel="AirPlay and Bluetooth devices"
          />
        </View>
      )}
      {showBuffering && (
        <View
          style={styles.loadingOverlay}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          <LoadingIndicator variant="inline" appearance="onDark" message="Buffering…" />
        </View>
      )}
    </View>
  );
}

type InlinePlaybackFailureProps = {
  message: string;
  onRetry: () => void;
  onOpenExternal: () => void;
};

function InlinePlaybackFailure({ message, onRetry, onOpenExternal }: InlinePlaybackFailureProps) {
  return (
    <View style={styles.inlineFailure}>
      <AlertCircle size={moderateScale(36)} color={colors.status.error} />
      <SmartText variant="body1" style={styles.inlineFailureText}>
        {message}
      </SmartText>
      <View style={styles.inlineFailureActions}>
        <TouchableOpacity
          style={styles.inlineRetryBtn}
          onPress={onRetry}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Retry playback"
        >
          <RefreshCw size={moderateScale(18)} color={colors.background.default} />
          <SmartText variant="body1" style={styles.inlineRetryBtnText}>
            Try again
          </SmartText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inlineExternalBtn}
          onPress={onOpenExternal}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Open in browser"
        >
          <ExternalLink size={moderateScale(18)} color={colors.primary.main} />
          <SmartText variant="body1" style={styles.inlineExternalBtnText}>
            Open in browser
          </SmartText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function VideoPlayerScreen() {
  const router = useRouter();
  const { url } = useLocalSearchParams<{ url: string }>();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();
  const { isTablet } = useResponsive();

  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inlinePlaybackError, setInlinePlaybackError] = useState<string | null>(null);
  const [mediaRetryKey, setMediaRetryKey] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const fetchVideo = useCallback(async () => {
    if (!url) {
      setError('No video specified');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setInlinePlaybackError(null);
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

  const handleNativePlaybackError = useCallback(() => {
    setInlinePlaybackError(
      'Couldn’t play this video. It may be unavailable or use a format your device can’t play.',
    );
  }, []);

  const handleEmbedLoadError = useCallback(() => {
    setInlinePlaybackError(
      'This page couldn’t be loaded in the app. You can open it in your browser instead.',
    );
  }, []);

  const handleRetryMedia = useCallback(() => {
    setInlinePlaybackError(null);
    setMediaRetryKey((k) => k + 1);
  }, []);

  const handleOpenVideoUrl = useCallback(() => {
    if (!video?.video_url) return;
    Linking.openURL(video.video_url).catch(() => {});
  }, [video?.video_url]);

  if (loading) {
    return (
      <View style={screenChrome.container}>
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerContent}>
            <SmartText variant="h3" style={styles.headerTitle}>Video</SmartText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingIndicator variant="inline" message="Loading video…" />
        </View>
      </View>
    );
  }

  if (error || !video) {
    return (
      <View style={screenChrome.container}>
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerContent}>
            <SmartText variant="h3" style={styles.headerTitle}>Video</SmartText>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={moderateScale(48)} color={colors.status.error} />
          <SmartText variant="h3" style={styles.errorTitle}>Video unavailable</SmartText>
          <SmartText variant="body1" style={styles.errorText}>
            {getUserFacingErrorMessage(error, 'Video not found')}
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
              <SmartText variant="body1" style={styles.secondaryButtonText}>Go back</SmartText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const directVideo = isDirectVideoUrl(video.video_url);
  const formattedDate = formatVideoDate(video.published_date_time);

  return (
    <View style={screenChrome.container}>
      <Animated.View
        entering={FadeInDown.delay(100)}
        style={[styles.header, { paddingTop: headerPaddingTop }]}
      >
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerContent}>
          <SmartText variant="h3" style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">
            {video.video_title || 'Video'}
          </SmartText>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        overScrollMode="never"
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          screenChrome.scrollContent,
          styles.scrollContentInner,
          { paddingBottom: scrollContentPaddingBottom + responsiveSize.md },
        ]}
      >
        <View style={[styles.pageInner, isTablet && styles.pageInnerTablet]}>
          <Animated.View entering={FadeInUp.delay(200)} style={styles.videoSection}>
            <View style={styles.videoStage}>
              <View
                style={styles.videoContainer}
                accessibilityLabel={`Video: ${video.video_title || 'content'}`}
              >
                {directVideo && !inlinePlaybackError && (
                  <DirectNativeVideo
                    key={`${video.video_url}-${mediaRetryKey}`}
                    uri={video.video_url}
                    title={video.video_title}
                    description={video.video_description}
                    onError={handleNativePlaybackError}
                  />
                )}
                {!directVideo && (
                  <WebViewContainer
                    key={`wv-${video.video_url}-${mediaRetryKey}`}
                    url={video.video_url}
                    javaScriptEnabled
                    onError={handleEmbedLoadError}
                  />
                )}
                {inlinePlaybackError && (
                  <InlinePlaybackFailure
                    message={inlinePlaybackError}
                    onRetry={handleRetryMedia}
                    onOpenExternal={handleOpenVideoUrl}
                  />
                )}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300)} style={styles.detailsSection}>
            <Card variant="elevated" padding="lg" style={styles.detailsCard}>
              <SmartText variant="caption" style={styles.eyebrow}>
                Video details
              </SmartText>
              <SmartText variant="h2" style={styles.detailTitle} maxLines={4}>
                {video.video_title}
              </SmartText>

              <View style={styles.metaToolbar}>
                <View style={styles.dateChip}>
                  <Calendar size={moderateScale(14)} color={colors.primary.dark} />
                  <SmartText variant="caption" style={styles.dateChipText}>
                    {formattedDate ? `Published ${formattedDate}` : 'Date not available'}
                  </SmartText>
                </View>

                <View style={styles.actionCluster}>
                  <TouchableOpacity
                    style={[styles.actionPill, isLiked && styles.actionPillActive]}
                    onPress={() => setIsLiked((v) => !v)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
                    accessibilityState={{ selected: isLiked }}
                  >
                    <ThumbsUp
                      size={moderateScale(19)}
                      color={isLiked ? colors.primary.main : colors.text.secondary}
                      fill={isLiked ? colors.primary.main : 'none'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionPill, isBookmarked && styles.actionPillActive]}
                    onPress={() => setIsBookmarked((v) => !v)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                    accessibilityState={{ selected: isBookmarked }}
                  >
                    <Bookmark
                      size={moderateScale(19)}
                      color={isBookmarked ? colors.primary.main : colors.text.secondary}
                      fill={isBookmarked ? colors.primary.main : 'none'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={handleShare}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Share video"
                  >
                    <Share2 size={moderateScale(19)} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {!!video.video_description?.trim() && (
                <View style={styles.descriptionBlock}>
                  <SmartText variant="caption" style={styles.sectionLabel}>
                    Description
                  </SmartText>
                  <SmartText variant="body1" style={styles.description}>
                    {video.video_description}
                  </SmartText>
                </View>
              )}
            </Card>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background.default,
    paddingHorizontal: responsiveSize.lg,
    paddingBottom: responsiveSize.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
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
    backgroundColor: colors.background.subtle,
  },
  scrollContentInner: {
    flexGrow: 1,
    paddingTop: responsiveSize.md,
    paddingHorizontal: responsiveSize.md,
  },
  pageInner: {
    width: '100%',
    gap: responsiveSize.lg,
  },
  pageInnerTablet: {
    maxWidth: 900,
    alignSelf: 'center',
  },
  videoSection: {
    width: '100%',
  },
  videoStage: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
    ...platformStyles.shadowMd,
    ...(Platform.OS === 'android' ? androidCardOutline : {}),
  },
  detailsSection: {
    width: '100%',
  },
  detailsCard: {
    borderRadius: borderRadius.xl,
  },
  eyebrow: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.primary.main,
    marginBottom: responsiveSize.xs,
  },
  detailTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: responsiveSize.md,
  },
  metaToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: responsiveSize.sm,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    backgroundColor: colors.background.subtle,
    paddingHorizontal: responsiveSize.md,
    paddingVertical: responsiveSize.sm,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[200],
    maxWidth: '100%',
  },
  dateChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
    flexShrink: 1,
  },
  actionCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  actionPill: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.subtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionPillActive: {
    backgroundColor: `${colors.primary.main}14`,
    borderColor: `${colors.primary.main}40`,
  },
  descriptionBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[200],
    paddingTop: responsiveSize.lg,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: responsiveSize.sm,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: responsiveSize.md,
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  nativeVideoStack: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  airPlayWrap: {
    position: 'absolute',
    top: responsiveSize.sm,
    right: responsiveSize.sm,
    left: undefined,
    zIndex: 2,
  },
  airPlayBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 3,
  },
  inlineFailure: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSize.lg,
    backgroundColor: '#0d0d0d',
    zIndex: 4,
    gap: responsiveSize.md,
  },
  inlineFailureText: {
    color: colors.gray[200],
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
  inlineFailureActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsiveSize.sm,
    justifyContent: 'center',
  },
  inlineRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs,
    backgroundColor: colors.primary.main,
    paddingHorizontal: responsiveSize.md,
    paddingVertical: responsiveSize.sm,
    borderRadius: borderRadius.lg,
    minHeight: MIN_TOUCH_TARGET,
  },
  inlineRetryBtnText: {
    color: colors.background.default,
    fontWeight: '600',
  },
  inlineExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs,
    borderWidth: 1,
    borderColor: colors.gray[600],
    paddingHorizontal: responsiveSize.md,
    paddingVertical: responsiveSize.sm,
    borderRadius: borderRadius.lg,
    minHeight: MIN_TOUCH_TARGET,
  },
  inlineExternalBtnText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  description: {
    ...typography.body1,
    color: colors.text.secondary,
    lineHeight: 26,
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
