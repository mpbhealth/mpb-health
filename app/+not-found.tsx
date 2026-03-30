import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { screenChrome } from '@/utils/screenChrome';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[screenChrome.container, styles.center]}>
        <Text style={styles.text}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
