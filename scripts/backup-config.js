const fs = require('fs');
const path = require('path');

const BACKUP_ROOT = 'C:\\RUSHUES BACKUP';

module.exports = {
  BACKUP_ROOT,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/rushes',
  RETENTION: {
    daily: 30,
    weekly: 12,
    monthly: 12
  },
  DIRS: {
    frontend: path.join(BACKUP_ROOT, 'frontend'),
    backend: path.join(BACKUP_ROOT, 'backend'),
    database: path.join(BACKUP_ROOT, 'database'),
    uploads: path.join(BACKUP_ROOT, 'uploads'),
    configs: path.join(BACKUP_ROOT, 'configs'),
    logs: path.join(BACKUP_ROOT, 'logs'),
    snapshots: path.join(BACKUP_ROOT, 'snapshots'),
  }
};
