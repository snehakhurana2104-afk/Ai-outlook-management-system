const emailService = require('../server/services/emailService');

(async () => {
  try {
    console.log('Starting programmatic sync...');
    const res = await emailService.syncOutlookEmails();
    console.log('Sync result:', res);
    process.exit(0);
  } catch (err) {
    console.error('Sync error:', err);
    process.exit(1);
  }
})();
