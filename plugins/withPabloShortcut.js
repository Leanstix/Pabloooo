const { withAndroidManifest, withDangerousMod, createRunOncePlugin } = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');
const backupRules = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
  <exclude domain="root" path="." />
  <exclude domain="file" path="." />
  <exclude domain="database" path="." />
  <exclude domain="sharedpref" path="." />
  <exclude domain="external" path="." />
</full-backup-content>`;
const extractionRules = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup disableIfNoEncryptionCapabilities="true">
    <exclude domain="root" path="." />
    <exclude domain="file" path="." />
    <exclude domain="database" path="." />
    <exclude domain="sharedpref" path="." />
    <exclude domain="external" path="." />
  </cloud-backup>
  <device-transfer>
    <exclude domain="root" path="." />
    <exclude domain="file" path="." />
    <exclude domain="database" path="." />
    <exclude domain="sharedpref" path="." />
    <exclude domain="external" path="." />
  </device-transfer>
</data-extraction-rules>`;
function withPabloShortcut(config) {
  config = withAndroidManifest(config, cfg => {
    const app = cfg.modResults.manifest.application[0].$;
    app['android:allowBackup'] = 'false';
    app['android:fullBackupContent'] = '@xml/pablo_backup_rules';
    app['android:dataExtractionRules'] = '@xml/pablo_data_extraction_rules';
    return cfg;
  });
  return withDangerousMod(config, ['android', async cfg => {
    const dir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'pablo_backup_rules.xml'), backupRules);
    fs.writeFileSync(path.join(dir, 'pablo_data_extraction_rules.xml'), extractionRules);
    return cfg;
  }]);
}
module.exports = createRunOncePlugin(withPabloShortcut, 'pabloooo-local-shortcut-and-backup-policy', '1.0.0');
