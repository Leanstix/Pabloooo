import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFinanceController } from './src/app/useFinanceController';
import { FinanceApp } from './src/ui/FinanceApp';

function Application() {
  const { controller, fatal, retry } = useFinanceController();
  if (fatal) return <View style={styles.boot}>
    <Text style={styles.title}>Your records need attention</Text>
    <Text style={styles.body}>{fatal}</Text>
    <Text style={styles.body}>Existing data has been kept. Try opening it again.</Text>
    <Pressable accessibilityRole="button" onPress={retry} style={styles.button}>
      <Text style={styles.buttonText}>Try again</Text>
    </Pressable>
  </View>;
  if (!controller.ready) return <View style={styles.boot}>
    <ActivityIndicator size="large" color="#C6F36B" />
    <Text style={styles.title}>Pabloooo</Text>
    <Text style={styles.body}>Opening your local money journal…</Text>
  </View>;
  return <FinanceApp controller={controller} />;
}

export default function App() {
  return <SafeAreaProvider><StatusBar style="auto" /><Application /></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  boot: { flex: 1, justifyContent: 'center', padding: 32, backgroundColor: '#19382D', gap: 18 },
  title: { fontSize: 30, fontWeight: '800', color: '#F5F9ED' },
  body: { color: '#DFEADB', fontSize: 16, lineHeight: 25 },
  button: { backgroundColor: '#C6F36B', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 20, alignSelf: 'flex-start', minHeight: 48 },
  buttonText: { color: '#18301E', fontSize: 16, fontWeight: '700' },
});
