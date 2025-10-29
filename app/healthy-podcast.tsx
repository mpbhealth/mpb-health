// src/screens/HealthyPodcastScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
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
  SlideInRight
} from 'react-native-reanimated';
import { BackButton } from '@/components/common/BackButton';
import { supabase } from '@/lib/supabase';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  shadows,
  typography,
  spacing,
  borderRadius,
} from '@/constants/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface Video {
  video_url: string;
  video_title: string;
  video_description: string;
  published_date_time: string;
}

// Enhanced video card component with uniform sizing
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
    // this helps iOS feel nice; Android won't use this for visuals
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
      style={[styles.videoCard, styles.surface, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      entering={FadeInUp.delay(300 + index * 100)}
      layout={Layout.springify()}
      activeOpacity={1}
    >
      <View style={styles.videoContent}>
        <View style={styles.videoIconContainer}>
          <Play size={28} color={colors.primary.main} />
        </View>

        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {video.video_title}
          </Text>
          
          <Text
            style={styles.videoDescription}
            numberOfLines={expandedDescription ? undefined : 2}
          >
            {video.video_description}
          </Text>

          {video.video_description?.length > 100 && (
            <TouchableOpacity onPress={() => setExpandedDescription(v => !v)} style={styles.expandButton}>
              <Text style={styles.expandButtonText}>
                {expandedDescription ? 'Show less' : 'Show more'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.videoMeta}>
            <Calendar size={16} color={colors.text.secondary} />
            <Text style={styles.videoDate}>
              {formatDate(video.published_date_time)}
            </Text>
          </View>
        </View>

        <View style={styles.chevronContainer}>
          <ExternalLink size={20} color={colors.primary.main} />
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
}

export default function HealthyPodcastScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

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
        style={[
          styles.header,
          styles.surface,
          { paddingTop: Platform.OS === 'ios' ? insets.top + spacing.lg : spacing.xl },
        ]}
      >
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Healthy Podcast</Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl }
        ]}
      >
        <Animated.Text 
          style={styles.description} 
          entering={FadeInUp.delay(200)}
        >
          Watch our latest health and wellness videos to stay informed and live a healthier life.
        </Animated.Text>

        {error ? (
          <Animated.View 
            style={[styles.errorContainer, styles.surface]}
            entering={FadeInUp.delay(300)}
          >
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        ) : (
          <View style={[styles.videosGrid, isTablet && styles.videosGridTablet]}>
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
            <Play size={48} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>No Videos Available</Text>
            <Text style={styles.emptyText}>
              Check back soon for new health and wellness content.
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },

  // One reusable "surface" for Android/iOS parity
  surface: Platform.select({
    android: {
      elevation: 3,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(0,0,0,0.07)',
    },
    ios: { ...shadows.md },
    default: {},
  }),

  header: {
    backgroundColor: colors.background.default,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    fontWeight: '700',
    color: colors.text.primary,
  },

  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  description: {
    ...typography.body1,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },

  videosGrid: {
    gap: spacing.md,
  },
  videosGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  videoCard: {
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    minHeight: 120, // Uniform container size
  },
  videoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    minHeight: 120, // Ensures uniform height
  },

  // No shadows on these small elements (prevents dark blobs on Android)
  videoIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.primary.main}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary.main}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },

  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    ...typography.h4,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  videoDescription: {
    ...typography.body2,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  expandButton: {
    marginBottom: spacing.sm,
  },
  expandButtonText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '500',
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  videoDate: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '400',
  },

  errorContainer: {
    backgroundColor: `${colors.status.error}10`,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    ...typography.body1,
    color: colors.status.error,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 24,
  },
});
