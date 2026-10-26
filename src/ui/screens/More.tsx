import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Text } from '../components/Text';
import { MenuRow } from '../components/MenuRow';
import { useTheme } from '../theme/Theme';
export type MorePage = 'categories' | 'recurring' | 'settings';
export function More({
  navigate,
  calculator,
}: {
  navigate: (page: MorePage) => void;
  calculator: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Screen
      eyebrow="The little extras"
      title="Your space"
      subtitle="Keep things organized. Make it your own."
    >
      <Card>
        <MenuRow
          title="Categories"
          subtitle="Shape your income and spending categories"
          icon="shapes-outline"
          onPress={() => navigate('categories')}
        />
        <MenuRow
          title="Recurring entries"
          subtitle="Bills, subscriptions and regular income"
          icon="repeat-outline"
          onPress={() => navigate('recurring')}
        />
        <MenuRow
          title="Quick calculator"
          subtitle="Work it out, then save it as an entry"
          icon="calculator-outline"
          onPress={calculator}
        />
        <MenuRow
          title="Settings & data"
          subtitle="Budget cycle, reminders, exports and backups"
          icon="options-outline"
          onPress={() => navigate('settings')}
        />
      </Card>
      <Card style={{ backgroundColor: colors.raised, borderWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="shield-checkmark-outline" size={27} color={colors.positive} />
          <Text size={18} weight="700">
            A private little money journal.
          </Text>
        </View>
        <Text muted>
          Your financial life stays on this device. No account to create, no bank connection to
          manage.
        </Text>
        <Text size={12} muted>
          Make a backup now and then, so your journal can come with you.
        </Text>
      </Card>
    </Screen>
  );
}
