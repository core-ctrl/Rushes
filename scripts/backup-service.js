const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const config = require('./backup-config');

async function ensureDirs() {
  for (const dir of Object.values(config.DIRS)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

async function runBackup() {
  console.log('Starting backup process...');
  await ensureDirs();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dbBackupPath = path.join(config.DIRS.database, `dump-${timestamp}`);
  
  // Mongodump command
  const dumpCmd = `mongodump --uri="${config.MONGODB_URI}" --out="${dbBackupPath}"`;
  
  exec(dumpCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Backup failed: ${error.message}`);
      fs.appendFileSync(path.join(config.DIRS.logs, 'backup-error.log'), `[${new Date().toISOString()}] ${error.message}\n`);
      return;
    }
    console.log(`Database backup successful: ${dbBackupPath}`);
    fs.appendFileSync(path.join(config.DIRS.logs, 'backup-success.log'), `[${new Date().toISOString()}] Successfully created backup at ${dbBackupPath}\n`);
  });
}

runBackup();
