import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { AppController } from '../app/contracts';
import { ThemeProvider, useTheme } from './theme/Theme';
import { Tab, TabBar } from './components/TabBar';
import { Text } from './components/Text';
import { Dashboard } from './screens/Dashboard';
import { Activity } from './screens/Activity';
import { Insights } from './screens/Insights';
import { Planner } from './screens/Planner';
import { More, MorePage } from './screens/More';
import { Categories } from './screens/Categories';
import { Recurring } from './screens/Recurring';
import { Settings } from './screens/Settings';
import { Welcome } from './screens/Welcome';
import { Calculator } from './screens/Calculator';
import { EntryDraft, EntryEditor } from './screens/EntryEditor';
export function FinanceApp({ controller }: { controller: AppController }) {
  return <ThemeProvider mode={controller.state.settings.theme}><FinanceShell controller={controller} /></ThemeProvider>;
}
function FinanceShell({ controller }: { controller: AppController }) {
  const { colors, dark } = useTheme(); const [tab, setTab] = useState<Tab>('home'); const [page, setPage] = useState<MorePage | null>(null); const [draft, setDraft] = useState<EntryDraft | null>(null); const [calculator, setCalculator] = useState(false);
  useEffect(() => { const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (page) { setPage(null); return true; } if (tab !== 'home') { setTab('home'); return true; } return false; }); return () => sub.remove(); }, [page, tab]);
  let content: React.ReactNode;
  if (!controller.ready) content = <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}><ActivityIndicator size="large" color={colors.positive} /><Text muted>Opening your journal…</Text></View>;
  else if (!controller.state.settings.onboardingComplete) content = <Welcome controller={controller} />;
  else if (page === 'categories') content = <Categories controller={controller} />;
  else if (page === 'recurring') content = <Recurring controller={controller} />;
  else if (page === 'settings') content = <Settings controller={controller} />;
  else if (tab === 'home') content = <Dashboard controller={controller} add={setDraft} calculator={() => setCalculator(true)} activity={() => setTab('activity')} planner={() => setTab('plan')} />;
  else if (tab === 'activity') content = <Activity controller={controller} add={setDraft} />;
  else if (tab === 'insights') content = <Insights controller={controller} />;
  else if (tab === 'plan') content = <Planner controller={controller} />;
  else content = <More navigate={setPage} calculator={() => setCalculator(true)} />;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><StatusBar style={dark ? 'light' : 'dark'} />{page && <Pressable accessibilityRole="button" accessibilityLabel="Back to your space" onPress={() => setPage(null)} style={{ paddingHorizontal: 22, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 }}><Ionicons name="chevron-back" color={colors.ink} size={20} /><Text size={14} weight="600">Your space</Text></Pressable>}{controller.error && <Pressable accessibilityRole="button" accessibilityLabel="Dismiss error" onPress={controller.dismissError} style={{ margin: 12, padding: 14, borderRadius: 14, backgroundColor: colors.raised }}><Text accessibilityRole="alert" color={colors.negative} size={13}>{controller.error}</Text><Text size={11} muted>Tap to dismiss</Text></Pressable>}<View style={{ flex: 1 }}>{content}</View>{controller.ready && controller.state.settings.onboardingComplete && <TabBar tab={tab} onChange={value => { setTab(value); setPage(null); }} />}{draft && <EntryEditor controller={controller} draft={draft} onClose={() => setDraft(null)} />}{calculator && <Calculator onClose={() => setCalculator(false)} add={setDraft} />}</SafeAreaView>;
}
