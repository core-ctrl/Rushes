const { exec } = require('child_process');
const config = require('./backup-config');
const path = require('path');

const targetBackup = process.argv[2];

if (!targetBackup) {
  console.error("Please provide the backup folder name (e.g., dump-2026-06-03T10-00-00-000Z)");
  process.exit(1);
}

const restorePath = path.join(config.DIRS.database, targetBackup);

console.log(`Starting restore from ${restorePath}...`);

const restoreCmd = `mongorestore --uri="${config.MONGODB_URI}" "${restorePath}"`;

exec(restoreCmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Restore failed: ${error.message}`);
    return;
  }
  console.log('Restore completed successfully.');
});
