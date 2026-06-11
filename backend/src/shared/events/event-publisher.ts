import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { EventSource } from '../types';

let prisma: PrismaClient;

export function setEventPrisma(client: PrismaClient) {
  prisma = client;
}

export interface EventPayload {
  eventName: string;
  actorId?: string;
  actorType?: string;
  entityId?: string;
  entityType?: string;
  payload?: Record<string, unknown>;
  source?: EventSource;
  requestId?: string;
}

export async function publishEvent(event: EventPayload) {
  try {
    await prisma.eventLog.create({
      data: {
        id: uuidv4(),
        eventName: event.eventName,
        actorId: event.actorId,
        actorType: event.actorType,
        entityId: event.entityId,
        entityType: event.entityType,
        payload: event.payload as object | undefined,
        source: event.source || 'system_job',
        requestId: event.requestId,
      },
    });
  } catch {
    // Non-critical: don't fail the main operation if event logging fails
  }
}

export async function publishAuditLog(params: {
  actorId: string;
  actorType: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorType: params.actorType,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: params.oldValue as object | undefined,
        newValue: params.newValue as object | undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        requestId: params.requestId,
      },
    });
  } catch {
    // Non-critical
  }
}
