const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

console.log('Backup scheduler started. Will run daily at 3:00 AM.');

// Run at 3:00 AM every day
cron.schedule('0 3 * * *', () => {
  console.log(`[${new Date().toISOString()}] Triggering scheduled backup...`);
  const serviceScript = path.join(__dirname, 'backup-service.js');
  exec(`node "${serviceScript}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Scheduled backup failed: ${error.message}`);
      return;
    }
    console.log('Scheduled backup completed.');
  });
});
