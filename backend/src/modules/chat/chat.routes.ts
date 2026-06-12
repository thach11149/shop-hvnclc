import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export function createChatRouter() {
  const router = Router();

  router.get('/chat/threads', authenticate, async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const threads = await prisma.chatThread.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: {
        buyer: { select: { email: true } },
        seller: { select: { email: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
    sendSuccess(res, { data: threads.map(t => ({ ...t, lastMessage: t.messages[0]?.content })), total: threads.length });
  });

  router.post('/chat/threads', authenticate, async (req: AuthRequest, res) => {
    const { sellerId, shopId } = req.body;
    const buyerId = req.user!.id;
    const existing = await prisma.chatThread.findFirst({ where: { buyerId, sellerId } });
    if (existing) { sendSuccess(res, existing); return; }
    const thread = await prisma.chatThread.create({
      data: { id: uuidv4(), buyerId, sellerId, shopId },
    });
    sendSuccess(res, thread, 'Thread created', 201);
  });

  router.get('/chat/threads/:id/messages', authenticate, async (req: AuthRequest, res) => {
    const messages = await prisma.chatMessage.findMany({
      where: { threadId: req.params.id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    sendSuccess(res, { data: messages, total: messages.length });
  });

  router.post('/chat/threads/:id/messages', authenticate, async (req: AuthRequest, res) => {
    const message = await prisma.chatMessage.create({
      data: {
        id: uuidv4(),
        threadId: req.params.id,
        senderId: req.user!.id,
        content: req.body.content,
        type: 'TEXT',
      },
    });
    await prisma.chatThread.update({ where: { id: req.params.id }, data: { updatedAt: new Date() } });
    sendSuccess(res, message, 'Message sent', 201);
  });

  return router;
}
