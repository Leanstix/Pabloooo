import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import type { AppController } from '../../app/contracts';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Section } from '../components/Section';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { Segmented } from '../components/Segmented';
import { MenuRow } from '../components/MenuRow';
import { DataTools } from '../components/DataTools';
import { Text } from '../components/Text';
import { useTask } from '../hooks/useTask';
import { useTheme } from '../theme/Theme';
export function Settings({ controller }: { controller: AppController }) {
  const { state } = controller;
  const { colors } = useTheme();
  const [day, setDay] = useState(String(state.settings.cycleStartDay));
  const task = useTask();
  function saveDay() {
    const value = Number(day);
    if (!/^\d{1,2}$/.test(day) || !Number.isInteger(value) || value < 1 || value > 31)
      return task.setError('Choose a day between 1 and 31.');
    task.run(() =>
      controller.dispatch({ type: 'settings.update', value: { cycleStartDay: value } }),
    );
  }
  return (
    <Screen title="Make yourself at home" subtitle="A few things, just the way you like them.">
      <Card>
        <Section title="Your budget rhythm" />
        <Field
          label="Cycle starts on day"
          value={day}
          onChangeText={setDay}
          keyboardType="number-pad"
          maxLength={2}
          hint="1–31. Shorter months use their last day. Existing budgets remain attached to their original cycles."
        />
        <Button label="Save cycle day" variant="secondary" onPress={saveDay} busy={task.busy} />
      </Card>
      <Card>
        <Section title="Look & feel" />
        <Segmented
          value={state.settings.theme}
          onChange={(theme) =>
            task.run(() => controller.dispatch({ type: 'settings.update', value: { theme } }))
          }
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
        <Text size={12} muted>
          Animations follow your device’s reduced motion preference.
        </Text>
      </Card>
      <Card>
        <Section title="Gentle check-ins" />
        <MenuRow
          title="Daily reminders"
          subtitle={`${state.settings.morningTime} and ${state.settings.eveningTime} · device time`}
          icon="notifications-outline"
          trailing={
            <Switch
              accessibilityLabel="Enable twice daily reminders"
              value={state.settings.remindersEnabled}
              disabled={task.busy}
              onValueChange={(enabled) => task.run(() => controller.setReminders(enabled))}
              trackColor={{ false: colors.line, true: colors.positive }}
              thumbColor={colors.accent}
            />
          }
        />
        <Text size={12} muted>
          Android may ask for notification permission. Check-ins are scheduled on this device.
        </Text>
      </Card>
      <Card>
        <Section title="A shortcut that feels like you" />
        <MenuRow
          title="Choose a PNG shortcut icon"
          subtitle="Pin your own image to the Android home screen"
          icon="image-outline"
          onPress={() => task.run(() => controller.createShortcut())}
        />
      </Card>
      <DataTools controller={controller} />
      {!!task.error && (
        <Text accessibilityRole="alert" color={colors.negative}>
          {task.error}
        </Text>
      )}
      <View style={{ alignItems: 'center', gap: 5 }}>
        <Text weight="700">Pabloooo</Text>
        <Text size={12} muted>
          NGN only. Offline by design. All yours.
        </Text>
        <Text size={11} muted>
          Version 1.0.0
        </Text>
      </View>
    </Screen>
  );
}
