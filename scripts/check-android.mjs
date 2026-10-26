import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const manifest = await readFile('android/app/src/main/AndroidManifest.xml', 'utf8');
for (const permission of [
  'INTERNET',
  'ACCESS_NETWORK_STATE',
  'RECORD_AUDIO',
  'SYSTEM_ALERT_WINDOW',
  'WRITE_EXTERNAL_STORAGE',
]) {
  const element = [...manifest.matchAll(/<uses-permission\b[^>]*>/g)]
    .map((match) => match[0])
    .find((value) => value.includes(`android.permission.${permission}"`));
  assert.ok(
    element?.includes('tools:node="remove"'),
    `${permission} must be removed from the production manifest`,
  );
}
assert.match(manifest, /android:allowBackup="false"/);
assert.match(manifest, /android:dataExtractionRules="@xml\/pablo_data_extraction_rules"/);
assert.match(manifest, /expo\.modules\.updates\.ENABLED" android:value="false"/);
const rules = await readFile(
  'android/app/src/main/res/xml/pablo_data_extraction_rules.xml',
  'utf8',
);
for (const section of ['cloud-backup', 'device-transfer']) {
  const content = new RegExp(`<${section}[^>]*>([\\s\\S]*?)<\\/${section}>`).exec(rules)?.[1];
  assert.ok(content, `${section} rules missing`);
  for (const domain of ['root', 'file', 'database', 'sharedpref', 'external']) {
    assert.ok(content.includes(`domain="${domain}" path="."`), `${section} must exclude ${domain}`);
  }
}
process.stdout.write(
  'Prebuilt Android privacy configuration verified. Native compilation/device behaviour is a separate check.\n',
);
