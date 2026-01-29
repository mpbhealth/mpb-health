import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Play, Calendar, ExternalLink } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { SmartText } from '@/components/common/SmartText';
import { Card } from '@/components/common/Card';
import { supabase } from '@/lib/supabase';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { colors, borderRadius } from '@/constants/theme';
import { responsiveSize, moderateScale, MIN_TOUCH_TARGET, platformStyles } from '@/utils/scaling';
import { useResponsive } from '@/hooks/useResponsive';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface Video {
  video_url: string;
  video_title: string;
  video_description: string;
  published_date_time: string;
}

function VideoCard({ video, index, onPress }: { video: Video, index: number, onPress: () => void }) {
  const [expandedDescription, setExpandedDescription] = useState(false);
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    shadowOpacity: shadowOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    translateY.value = withSpring(2, { damping: 15, stiffness: 300 });
    shadowOpacity.value = withTiming(0.2, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 300 });
    shadowOpacity.value = withTiming(0.1, { duration: 150 });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <AnimatedTouchableOpacity
      style={[styles.videoCard, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      entering={FadeInUp.delay(300 + index * 100)}
      layout={Layout.springify()}
      activeOpacity={1}
    >
      <View style={styles.videoContent}>
        <View style={styles.videoIconContainer}>
          <Play size={moderateScale(24)} color={colors.primary.main} />
        </View>

        <View style={styles.videoInfo}>
          <SmartText variant="body1" style={styles.videoTitle}>
            {video.video_title}
          </SmartText>

          <SmartText
            variant="body2"
            style={styles.videoDescription}
            numberOfLines={expandedDescription ? undefined : 2}
          >
            {video.video_description}
          </SmartText>

          {video.video_description?.length > 100 && (
            <TouchableOpacity onPress={() => setExpandedDescription(v => !v)} style={styles.expandButton}>
              <SmartText variant="caption" style={styles.expandButtonText}>
                {expandedDescription ? 'Show less' : 'Show more'}
              </SmartText>
            </TouchableOpacity>
          )}

          <View style={styles.videoMeta}>
            <Calendar size={moderateScale(14)} color={colors.text.secondary} />
            <SmartText variant="caption" style={styles.videoDate}>
              {formatDate(video.published_date_time)}
            </SmartText>
          </View>
        </View>

        <View style={styles.chevronContainer}>
          <ExternalLink size={moderateScale(18)} color={colors.primary.main} />
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
}

export default function HealthyPodcastScreen() {
  const router = useRouter();
  const { isTablet } = useResponsive();

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const { data, error: fetchError } = await supabase
          .from('videos')
          .select('*')
          .order('published_date_time', { ascending: false });

        if (fetchError) throw fetchError;
        setVideos(data || []);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Unable to load videos at this time.');
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  const handleVideoPress = (video: Video) => {
    router.push({
      pathname: '/video-player',
      params: {
        url: video.video_url,
        title: video.video_title,
      },
    });
  };

  if (loading) return <LoadingIndicator />;

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.delay(100)}
        style={styles.header}
      >
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerContent}>
          <SmartText variant="h2" style={styles.headerTitle}>Healthy Podcast</SmartText>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.maxWidthContainer, isTablet && styles.tabletMaxWidth]}>
          <Animated.View entering={FadeInUp.delay(200)}>
            <SmartText variant="body1" style={styles.description}>
              Watch our latest health and wellness videos to stay informed and live a healthier life.
            </SmartText>
          </Animated.View>

          {error ? (
            <Animated.View entering={FadeInUp.delay(300)}>
              <Card padding="lg" variant="outlined" style={styles.errorContainer}>
                <SmartText variant="body1" style={styles.errorText}>{error}</SmartText>
              </Card>
            </Animated.View>
          ) : (
            <View style={styles.videosGrid}>
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

          {videos.length === 0 && !error && !loading && (
            <Animated.View
              style={styles.emptyState}
              entering={FadeInUp.delay(300)}
            >
              <Play size={moderateScale(48)} color={colors.gray[300]} />
              <SmartText variant="h3" style={styles.emptyTitle}>No Videos Available</SmartText>
              <SmartText variant="body1" style={styles.emptyText}>
                Check back soon for new health and wellness content.
              </SmartText>
            </Animated.View>
          )}
        </View>
      </ScrollView>
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
    padding: responsiveSize.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    ...platformStyles.shadowSm,
  },
  headerContent: {
    flex: 1,
    marginLeft: responsiveSize.xs,
  },
  headerTitle: {
    fontWeight: '700',
    color: colors.text.primary,
  },

  content: {
    flex: 1,
  },
  scrollContent: {
    padding: responsiveSize.md,
    paddingBottom: responsiveSize.xl,
  },

  maxWidthContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  tabletMaxWidth: {
    maxWidth: 900,
  },

  description: {
    color: colors.text.secondary,
    marginBottom: responsiveSize.lg,
  },

  videosGrid: {
    gap: responsiveSize.md,
  },

  videoCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    minHeight: MIN_TOUCH_TARGET,
    ...platformStyles.shadowSm,
  },
  videoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveSize.md,
    gap: responsiveSize.sm,
    minHeight: MIN_TOUCH_TARGET,
  },

  videoIconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary.main}15`,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  chevronContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary.main}15`,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  videoInfo: {
    flex: 1,
    minWidth: 0,
    gap: responsiveSize.xs / 2,
  },
  videoTitle: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  videoDescription: {
    color: colors.text.secondary,
  },
  expandButton: {
    marginTop: responsiveSize.xs / 4,
  },
  expandButtonText: {
    color: colors.primary.main,
    fontWeight: '500',
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize.xs / 2,
    marginTop: responsiveSize.xs / 4,
  },
  videoDate: {
    color: colors.text.secondary,
  },

  errorContainer: {
    backgroundColor: `${colors.status.error}10`,
    borderColor: `${colors.status.error}30`,
    alignItems: 'center',
  },
  errorText: {
    color: colors.status.error,
    textAlign: 'center',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: responsiveSize.xl,
    gap: responsiveSize.md,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: moderateScale(300),
  },
});
