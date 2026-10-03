import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { APP_NAME } from '@gestor/shared';

export default function App(): JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>
          App do mecânico (offline-first) — scaffold Expo. Aqui entra a inspeção
          em campo e o consumo de peças com sync.
        </Text>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  title: { fontSize: 24, fontWeight: '600', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#475569', textAlign: 'center' },
});
