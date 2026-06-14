import { PrismaClient, WithdrawalStatus, LedgerType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../shared/utils/logger';
import { publishEvent } from '../shared/events/event-publisher';

// ============================================================
// Automated Seller Payout Job
// Run this on a cron schedule (e.g. daily at midnight)
// ============================================================

export async function runPayoutJob(prisma: PrismaClient) {
  logger.info('[PayoutJob] Starting automated payout run');

  try {
    // 1. Find pending withdrawal requests older than 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingWithdrawals = await prisma.withdrawalRequest.findMany({
      where: {
        status: WithdrawalStatus.PENDING,
        createdAt: { lte: cutoff },
      },
      include: {
        wallet: {
          include: {
            shop: {
              include: {
                sellerProfile: { include: { user: true } },
                bankAccounts: { where: { isDefault: true }, take: 1 },
              },
            },
          },
        },
      },
      take: 50,
    });

    logger.info(`[PayoutJob] Found ${pendingWithdrawals.length} pending withdrawals`);

    for (const withdrawal of pendingWithdrawals) {
      try {
        const bankAccount = withdrawal.wallet.shop.bankAccounts[0];
        if (!bankAccount) {
          logger.warn(`[PayoutJob] No bank account for shop ${withdrawal.wallet.shopId} — skipping`);
          continue;
        }

        // In production: call bank API / payment gateway to transfer funds
        // For now: mark as approved (simulate transfer)
        await prisma.$transaction([
          prisma.withdrawalRequest.update({
            where: { id: withdrawal.id },
            data: {
              status: WithdrawalStatus.COMPLETED,
              processedAt: new Date(),
              note: `Auto-processed by payout job. Bank: ${bankAccount.bankName} - ${bankAccount.accountNumber}`,
            },
          }),
          prisma.sellerLedgerEntry.create({
            data: {
              id: uuidv4(),
              walletId: withdrawal.walletId,
              type: LedgerType.WITHDRAWAL,
              amount: -withdrawal.amount.toNumber(),
              balanceAfter:
                withdrawal.wallet.balance.toNumber() - withdrawal.amount.toNumber(),
              note: `Withdrawal payout processed — ${withdrawal.id}`,
            },
          }),
          prisma.sellerWallet.update({
            where: { id: withdrawal.walletId },
            data: {
              balance: {
                decrement: withdrawal.amount,
              },
            },
          }),
        ]);

        await publishEvent({
          eventName: 'withdrawal.processed',
          entityId: withdrawal.id,
          entityType: 'withdrawal',
          payload: {
            shopId: withdrawal.wallet.shopId,
            amount: withdrawal.amount,
            bankAccount: bankAccount.accountNumber,
          },
        });

        logger.info(`[PayoutJob] Processed withdrawal ${withdrawal.id} — ${withdrawal.amount}`);
      } catch (err) {
        logger.error(`[PayoutJob] Failed to process withdrawal ${withdrawal.id}`, { err });
      }
    }

    // 2. Auto-complete orders that have been in DELIVERED status for 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deliveredOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        updatedAt: { lte: sevenDaysAgo },
      },
      take: 100,
    });

    logger.info(`[PayoutJob] Auto-completing ${deliveredOrders.length} delivered orders`);

    for (const order of deliveredOrders) {
      try {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: 'COMPLETED' },
          }),
          prisma.orderStatusHistory.create({
            data: {
              id: uuidv4(),
              orderId: order.id,
              fromStatus: 'DELIVERED',
              toStatus: 'COMPLETED',
              note: 'Auto-completed after 7 days delivery confirmation',
              actorType: 'system',
            },
          }),
        ]);

        await publishEvent({
          eventName: 'order.auto_completed',
          entityId: order.id,
          entityType: 'order',
          payload: { orderId: order.id, shopId: order.shopId },
        });
      } catch (err) {
        logger.error(`[PayoutJob] Failed to auto-complete order ${order.id}`, { err });
      }
    }

    logger.info('[PayoutJob] Payout run completed');
  } catch (err) {
    logger.error('[PayoutJob] Fatal error in payout job', { err });
  }
}

// ============================================================
// Simple interval-based scheduler
// In production, replace with a proper cron job / Bull queue
// ============================================================

export function startPayoutScheduler(prisma: PrismaClient) {
  const intervalHours = Number(process.env.PAYOUT_INTERVAL_HOURS) || 24;
  const intervalMs = intervalHours * 60 * 60 * 1000;

  logger.info(`[PayoutJob] Scheduler started — runs every ${intervalHours} hours`);

  // Run once after 5 minutes on startup
  setTimeout(() => {
    runPayoutJob(prisma).catch(err => logger.error('[PayoutJob] Startup run failed', { err }));
  }, 5 * 60 * 1000);

  // Then run on interval
  setInterval(() => {
    runPayoutJob(prisma).catch(err => logger.error('[PayoutJob] Interval run failed', { err }));
  }, intervalMs);
}
