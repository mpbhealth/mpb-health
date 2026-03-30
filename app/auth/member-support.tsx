import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, MessageSquare, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeHeaderPadding } from '@/hooks/useSafeHeaderPadding';
import { colors } from '@/constants/theme';
import { screenChrome } from '@/utils/screenChrome';
import { cardChromeSm } from '@/utils/scaling';

export default function MemberSupportScreen() {
  const router = useRouter();
  const { headerPaddingTop } = useSafeHeaderPadding();

  const handleCall = () => {
    Linking.openURL('tel:+18558164650');
  };

  const handleChat = () => {
    router.push('/chatWithConcierge');
  };

  return (
    <View style={screenChrome.container}>
      <Animated.View 
        style={[styles.header, { paddingTop: headerPaddingTop }]}
        entering={FadeInDown.delay(100)}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View 
        style={styles.content}
        entering={FadeInUp.delay(200)}
      >
        <Text style={styles.title}>Need Help?</Text>
        <Text style={styles.subtitle}>
          Our concierge team is here to assist you with your membership verification.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            If you registered today, please note that it may take up to 24 hours for your membership data to be fully processed in our system.
          </Text>
        </View>

        <View style={styles.supportOptions}>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleCall}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#0891b215' }]}>
              <Phone size={24} color="#0891b2" />
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Call Concierge</Text>
              <Text style={styles.buttonSubtitle}>1-855-816-4650</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleChat}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#05966915' }]}>
              <MessageSquare size={24} color="#059669" />
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Chat with Concierge</Text>
              <Text style={styles.buttonSubtitle}>Start a live chat session</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.supportHours}>
          Available Monday - Friday, 9:00 AM - 8:00 PM EST
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.background.default,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    ...cardChromeSm,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: `${colors.status.info}12`,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    maxWidth: 400,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${colors.status.info}30`,
  },
  infoText: {
    fontSize: 15,
    color: colors.status.info,
    lineHeight: 24,
    textAlign: 'center',
  },
  supportOptions: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
    marginBottom: 24,
  },
  supportButton: {
    backgroundColor: colors.background.default,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...cardChromeSm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  supportHours: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});