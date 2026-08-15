import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import { notify } from '../notifications/notifications.service';

// ---- Generic key/value platform settings (CMS text, escrow fee, system online flag, broadcast alert) ----

export const getSetting = async (key: string) => {
  const row = await prisma.platformSetting.findUnique({ where: { key } });
  return row?.value ?? null;
};

export const getAllSettings = async () => {
  const rows = await prisma.platformSetting.findMany();
  return Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value]));
};

export const setSetting = async (key: string, value: string, adminId: string) => {
  return prisma.platformSetting.upsert({
    where: { key },
    update: { value, updatedById: adminId },
    create: { key, value, updatedById: adminId }
  });
};

/**
 * Broadcasts a platform-wide alert notification to every non-frozen user.
 * Also stores the alert text under the 'broadcast_alert' setting key so it
 * can be shown as a persistent banner, not just a one-time notification.
 */
export const broadcastAlert = async (message: string, adminId: string) => {
  await setSetting('broadcast_alert', message, adminId);

  const users = await prisma.user.findMany({ where: { isFrozen: false }, select: { id: true } });
  await Promise.all(
    users.map((u) => notify({ userId: u.id, title: 'Platform announcement', message, type: 'ALERT' }))
  );

  return { recipientCount: users.length };
};

// ---- Promo codes ----

export const listPromoCodes = async () => {
  return prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
};

export const createPromoCode = async (adminId: string, code: string, discountPct: number, expiresAt?: Date) => {
  const existing = await prisma.promoCode.findUnique({ where: { code } });
  if (existing) throw new ApiError(409, 'This promo code already exists');

  return prisma.promoCode.create({
    data: { code: code.toUpperCase(), discountPct, createdById: adminId, expiresAt }
  });
};

export const togglePromoCode = async (promoId: string) => {
  const promo = await prisma.promoCode.findUnique({ where: { id: promoId } });
  if (!promo) throw new ApiError(404, 'Promo code not found');

  return prisma.promoCode.update({ where: { id: promoId }, data: { active: !promo.active } });
};

export const deletePromoCode = async (promoId: string) => {
  const promo = await prisma.promoCode.findUnique({ where: { id: promoId } });
  if (!promo) throw new ApiError(404, 'Promo code not found');
  await prisma.promoCode.delete({ where: { id: promoId } });
};