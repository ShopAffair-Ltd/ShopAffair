import { prisma } from '../../config/db';

// Subscriptions carry an expiresAt but nothing previously read it anywhere,
// so a lapsed plan kept the store fully active forever. This runs a cheap
// check on access instead of requiring a cron job: whenever a user's own
// data is touched by an authenticated request, we check whether their most
// recent active subscription has actually expired and, if so, flip isPro
// off and unlist their products in the same pass. Idempotent and safe to
// call on every request - it's a no-op once already synced.
export const syncStoreLockState = async (userId: string): Promise<void> => {
    const latestActive = await prisma.subscription.findFirst({
        where: { userId, active: true },
        orderBy: { createdAt: 'desc' }
    });

    if (!latestActive) return;
    if (!latestActive.expiresAt) return; // no expiry set - treat as non-expiring
    if (latestActive.expiresAt.getTime() > Date.now()) return; // still valid

    await prisma.$transaction([
        prisma.subscription.update({
            where: { id: latestActive.id },
            data: { active: false }
        }),
        prisma.user.update({
            where: { id: userId },
            data: { isPro: false }
        }),
        prisma.product.updateMany({
            where: { sellerId: userId },
            data: { isListed: false }
        })
    ]);
};