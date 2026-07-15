// backend/src/cron/checkoutSessionCleanup.js

import prisma from '../config/prisma.js';
import  cronLogger  from '../utils/cronLogger.js';

export async function expireStaleCheckoutSessions() {
  const logger = cronLogger('expire-checkout-sessions');
  logger.start();

  try {
    const result = await prisma.checkoutSession.updateMany({
      where: {
        status:     'created',
        expires_at: { lt: new Date() },
      },
      data: { status: 'expired' },
    });

    logger.success(`Expired ${result.count} stale checkout sessions`);
    return result.count;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}