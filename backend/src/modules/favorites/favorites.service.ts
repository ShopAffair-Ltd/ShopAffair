import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';

export const toggleFavorite = async (
  userId: string,
  params: { productId?: string; tradeId?: string }
): Promise<{ favorited: boolean }> => {
  const { productId, tradeId } = params;

  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } }
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await prisma.favorite.create({ data: { userId, productId } });
    return { favorited: true };
  }

  if (tradeId) {
    const trade = await prisma.trade.findUnique({ where: { id: tradeId }, select: { id: true } });
    if (!trade) {
      throw new ApiError(404, 'Trade not found');
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_tradeId: { userId, tradeId } }
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await prisma.favorite.create({ data: { userId, tradeId } });
    return { favorited: true };
  }

  throw new ApiError(400, 'Provide exactly one of productId or tradeId');
};

export const listFavorites = async (userId: string) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        include: {
          seller: { select: { id: true, username: true, name: true, avatarColor: true, verificationStatus: true } }
        }
      },
      trade: {
        include: {
          creator: { select: { id: true, username: true, name: true, avatarColor: true } },
          buyer: { select: { id: true, username: true, name: true, avatarColor: true } }
        }
      }
    }
  });

  return favorites;
};

/**
 * Returns the set of favorited product/trade IDs for a user, for cheaply
 * marking items as favorited when rendering a list (avoids N+1 lookups).
 */
export const getFavoriteIds = async (userId: string): Promise<{ productIds: string[]; tradeIds: string[] }> => {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { productId: true, tradeId: true }
  });

  return {
    productIds: favorites.map((f) => f.productId).filter((id): id is string => !!id),
    tradeIds: favorites.map((f) => f.tradeId).filter((id): id is string => !!id)
  };
};