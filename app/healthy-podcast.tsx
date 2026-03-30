import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Play, Calendar, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { EmptyState } from '@/components/common/EmptyState';
import { Card } from '@/components/common/Card';
import { supabase } from '@/lib/supabase';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { logger } from '@/lib/logger';
import { colors, typography, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles, androidCardOutline } from '@/utils/scaling';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { screenChrome } from '@/utils/screenChrome';
import { useResponsive } from '@/hooks/useResponsive';

interface Video {
  video_url: string;
  video_title: string;
  video_description: string;
  published_date_time: string;
}

function formatPublishedDate(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function VideoCard({ video, index, onPress }: { video: Video; index: number; onPress: () => void }) {
  const [expandedDescription, setExpandedDescription] = useState(false);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 16, stiffness: 320 });
    translateY.value = withSpring(1, { damping: 16, stiffness: 320 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 16, stiffness: 320 });
    translateY.value = withSpring(0, { damping: 16, stiffness: 320 });
  };

  const publishedLabel = formatPublishedDate(video.published_date_time);
  const hasLongDescription = (video.video_description?.length ?? 0) > 100;

  return (
    <Animated.View entering={FadeInUp.delay(280 + index * 72)} layout={Layout.springify()}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`Open video: ${video.video_title}`}
      >
        <Animated.View style={animatedStyle}>
          <Card variant="elevated" padding="md" style={styles.videoCard}>
            <View style={styles.videoContent}>
              <View style={styles.videoIconContainer}>
                <Play size={moderateScale(22)} color={colors.primary.main} />
              </View>

              <View style={styles.videoInfo}>
                <SmartText variant="body1" style={styles.videoTitle} maxLines={3}>
                  {video.video_title}
                </SmartText>

                {!!video.video_description?.trim() && (
                  <SmartText
                    variant="body2"
                    style={styles.videoDescription}
                    numberOfLines={expandedDescription ? undefined : 2}
                  >
                    {video.video_description}
                  </SmartText>
                )}

                {hasLongDescription && (
                  <TouchableOpacity
                    onPress={() => setExpandedDescription((v) => !v)}
                    style={styles.expandButton}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel={expandedDescription ? 'Show less description' : 'Show more description'}
                  >
                    <SmartText variant="caption" style={styles.expandButtonText}>
                      {expandedDescription ? 'Show less' : 'Show more'}
                    </SmartText>
                  </TouchableOpacity>
                )}

                <View style={styles.dateChip}>
                  <Calendar size={moderateScale(13)} color={colors.primary.dark} />
                  <SmartText variant="caption" style={styles.dateChipText}>
                    {publishedLabel ? `Published ${publishedLabel}` : 'Date not available'}
                  </SmartText>
                </View>
              </View>

              <View style={styles.openHint} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <ExternalLink size={moderateScale(18)} color={colors.primary.main} />
              </View>
            </View>
          </Card>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HealthyPodcastScreen() {
  const router = useRouter();
  const { isTablet } = useResponsive();
  const { headerPaddingTop, scrollContentPaddingBottom } = useSafeHeaderPadding();

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .order('published_date_time', { ascending: false });

      if (fetchError) throw fetchError;
      setVideos(data || []);
    } catch (err) {
      logger.error('HealthyPodcast: fetch videos failed', err);
      setError('Unable to load videos at this time.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleVideoPress = (video: Video) => {
    router.push({
      pathname: '/video-player',
      params: {
        url: video.video_url,
        title: video.video_title,
      },
    });
  };

  if (loading) {
    return (
      <View style={screenChrome.container}>
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerContent}>
            <SmartText variant="h2" style={styles.headerTitle}>
              Healthy Podcast
            </SmartText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingIndicator variant="inline" message="Loading videos…" />
        </View>
      </View>
    );
  }

  return (
    <View style={screenChrome.container}>
      <Animated.View
        entering={FadeInDown.delay(100)}
        style={[styles.header, { paddingTop: headerPaddingTop }]}
      >
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerContent}>
          <SmartText variant="h2" style={styles.headerTitle}>
            Healthy Podcast
          </SmartText>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          screenChrome.scrollContent,
          styles.scrollInner,
          { paddingBottom: scrollContentPaddingBottom + responsiveSize.lg },
        ]}
      >
        <View style={[styles.pageColumn, isTablet && styles.pageColumnTablet]}>
          <Animated.View entering={FadeInUp.delay(180)}>
            <Card variant="filled" padding="lg" style={styles.introCard}>
              <SmartText variant="caption" style={styles.introEyebrow}>
                Health library
              </SmartText>
              <SmartText variant="body1" style={styles.introBody}>
                Watch our latest health and wellness videos to stay informed and live a healthier life.
              </SmartText>
            </Card>
          </Animated.View>

          {error ? (
            <Animated.View entering={FadeInUp.delay(260)}>
              <Card padding="lg" variant="outlined" style={styles.errorCard}>
                <View style={styles.errorIconRow}>
                  <AlertCircle size={moderateScale(24)} color={colors.status.error} />
                </View>
                <SmartText variant="body1" style={styles.errorText}>
                  {error}
                </SmartText>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={fetchVideos}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading videos"
                >
                  <RefreshCw size={moderateScale(18)} color={colors.background.default} />
                  <SmartText variant="body1" style={styles.retryButtonText}>
                    Try again
                  </SmartText>
                </TouchableOpacity>
              </Card>
            </Animated.View>
          ) : (
            <View style={styles.videosList}>
              {videos.map((video, index) => (
                <VideoCard
                  key={video.video_url}
                  video={video}
                  index={index}
                  onPress={() => handleVideoPress(video)}
                />
              ))}
            </View>
          )}

          {videos.length === 0 && !error && (
            <Animated.View entering={FadeInUp.delay(280)} style={styles.emptyWrap}>
              <Card variant="outlined" padding="lg" style={styles.emptyCard}>
                <EmptyState
                  icon={<Play size={moderateScale(44)} color={colors.gray[300]} />}
                  message="No videos yet"
                  subtitle="Check back soon for new health and wellness content."
                />
              </Card>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background.default,
    paddingHorizontal: responsiveSize.md,
    paddingBottom: responsiveSize.md,
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
    ...typography.h2,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background.subtle,
  },
  scrollInner: {
    flexGrow: 1,
    paddingTop: responsiveSize.md,
    paddingHorizontal: responsiveSize.md,
  },
  pageColumn: {
    width: '100%',
    alignSelf: 'center',
    gap: responsiveSize.lg,
  },
  pageColumnTablet: {
    maxWidth: 900,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: responsiveSize.md,
  },
  introCard: {
    borderRadius: borderRadius.xl,
    ...(Platform.OS === 'android' ? androidCardOutline : {}),
  },
  introEyebrow: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.primary.main,
    marginBottom: responsiveSize.sm,
  },
  introBody: {
    ...typography.body1,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  videosList: {
    gap: responsiveSize.md,
  },
  videoCard: {
    borderRadius: borderRadius.xl,
  },
  videoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: responsiveSize.md,
    minHeight: MIN_TOUCH_TARGET,
  },
  videoIconContainer: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary.main}18`,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  videoInfo: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs,
  },
  videoTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  videoDescription: {
    ...typography.body2,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  expandButton: {
    alignSelf: 'flex-start',
    paddingVertical: responsiveSize.xs / 2,
  },
  expandButtonText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: moderateScale(6),
    marginTop: responsiveSize.xs,
    backgroundColor: colors.background.default,
    paddingHorizontal: responsiveSize.sm,
    paddingVertical: moderateScale(6),
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[200],
  },
  dateChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  openHint: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary.main}12`,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 4,
  },
  errorCard: {
    backgroundColor: `${colors.status.error}08`,
    borderColor: `${colors.status.error}35`,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    gap: responsiveSize.md,
  },
  errorIconRow: {
    marginBottom: responsiveSize.xs,
  },
  errorText: {
    ...typography.body1,
    color: colors.status.error,
    textAlign: 'center',
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
  emptyWrap: {
    marginTop: responsiveSize.sm,
  },
  emptyCard: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.background.default,
    ...(Platform.OS === 'android' ? androidCardOutline : {}),
  },
});
