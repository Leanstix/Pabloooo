import React from 'react';
import type { AppController } from '../../app/contracts';
import { Card } from './Card';
import { MenuRow } from './MenuRow';
import { Section } from './Section';
import { Text } from './Text';
import { useTask } from '../hooks/useTask';
export function DataTools({ controller }: { controller: AppController }) {
  const task = useTask();
  return (
    <Card>
      <Section title="Your data, yours to keep" />
      <MenuRow
        title="Export spreadsheet"
        subtitle="All entries, categories and reporting data"
        icon="grid-outline"
        onPress={() => task.run(() => controller.exportSpreadsheet())}
      />
      <MenuRow
        title="Create a backup"
        subtitle="A portable copy of your complete money journal"
        icon="cloud-download-outline"
        onPress={() => task.run(() => controller.exportBackup())}
      />
      <MenuRow
        title="Restore a backup"
        subtitle="Choose a Pabloooo backup from your device"
        icon="refresh-outline"
        onPress={() => task.run(() => controller.importBackup())}
      />
      {task.busy && (
        <Text accessibilityLiveRegion="polite" size={12} muted>
          Preparing your file…
        </Text>
      )}
      {!!task.error && <Text accessibilityRole="alert">{task.error}</Text>}
    </Card>
  );
}
