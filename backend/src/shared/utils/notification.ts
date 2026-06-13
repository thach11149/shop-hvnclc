import { PrismaClient } from '@prisma/client';

let prismaClient: PrismaClient;

export function setNotificationPrisma(client: PrismaClient) {
  prismaClient = client;
}

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  if (!prismaClient) return;
  try {
    await prismaClient.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data,
      },
    });
  } catch {
    // Non-critical: don't fail main operation if notification fails
  }
}

export async function createNotificationBulk(notifications: Array<{
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}>): Promise<void> {
  if (!prismaClient || notifications.length === 0) return;
  try {
    await prismaClient.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
      })),
    });
  } catch {
    // Non-critical
  }
}
