import React, { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { AppController } from '../../app/contracts';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Enter } from '../components/Enter';
import { useTheme } from '../theme/Theme';
import { useTask } from '../hooks/useTask';
export function Welcome({ controller }: { controller: AppController }) {
  const { colors } = useTheme();
  const [day, setDay] = useState('1');
  const [reminders, setReminders] = useState(true);
  const task = useTask();
  function start() {
    const cycleStartDay = Number(day);
    if (!/^\d{1,2}$/.test(day) || cycleStartDay < 1 || cycleStartDay > 31)
      return task.setError('Choose a cycle start day from 1 to 31.');
    task.run(async () => {
      await controller.dispatch({
        type: 'settings.update',
        value: { onboardingComplete: true, cycleStartDay },
      });
      // Completing setup does not depend on Android granting notification permission.
      // The controller presents a persistent error banner if scheduling is denied.
      if (reminders) await controller.setReminders(true).catch(() => undefined);
    });
  }
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 28,
        paddingVertical: 40,
        gap: 26,
        flexGrow: 1,
        justifyContent: 'center',
      }}
    >
      <Enter>
        <View style={{ height: 188, justifyContent: 'center', alignItems: 'center' }}>
          <View
            style={{
              width: 170,
              height: 170,
              borderRadius: 85,
              backgroundColor: colors.raised,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 110,
                height: 110,
                borderRadius: 38,
                backgroundColor: colors.accent,
                transform: [{ rotate: '-12deg' }],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="leaf" size={54} color={colors.accentInk} />
            </View>
          </View>
          <View
            style={{
              position: 'absolute',
              right: 20,
              top: 20,
              backgroundColor: colors.violet,
              borderRadius: 18,
              padding: 12,
            }}
          >
            <Text size={22}>₦</Text>
          </View>
        </View>
      </Enter>
      <View style={{ gap: 12 }}>
        <Text weight="700" size={13} muted style={{ letterSpacing: 3 }}>
          PABLOOOO
        </Text>
        <Text size={40} weight="800" style={{ letterSpacing: -1.4 }}>
          A little clarity.{`\n`}A little more you.
        </Text>
        <Text muted size={16}>
          Make sense of your money, one everyday moment at a time. Private, offline, and made for
          naira.
        </Text>
      </View>
      <Field
        label="When does your budget month begin?"
        value={day}
        onChangeText={setDay}
        keyboardType="number-pad"
        maxLength={2}
        hint="Choose a day from 1 to 31. You can change this anytime."
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text weight="600">A morning and evening check-in</Text>
          <Text size={12} muted>
            08:00 and 20:00 · Android will ask for notification permission.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Enable daily check-ins during setup"
          value={reminders}
          onValueChange={setReminders}
          trackColor={{ false: colors.line, true: colors.positive }}
          thumbColor={colors.accent}
        />
      </View>
      {!!task.error && (
        <Text accessibilityRole="alert" color={colors.negative}>
          {task.error}
        </Text>
      )}
      <Button label="Let’s begin" icon="arrow-forward" onPress={start} busy={task.busy} />
      <Text muted size={11} style={{ textAlign: 'center' }}>
        No sign-up. No bank connection. Just your own space.
      </Text>
    </ScrollView>
  );
}
