import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { prisma } from '../../config/db';
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
  productIdParamSchema
} from './products.validation';
import {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from './products.service';
import { deleteOwnTrade } from '../trades/trades.service';

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
};

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const input = createProductSchema.parse(req.body);
  const product = await createProduct(user.id, input);
  res.status(201).json({ product });
});

export const landingSummary = asyncHandler(async (_req: Request, res: Response) => {
  const [totalTraders, totalProducts, completedTrades, escrowAgg, recentReviews] = await Promise.all([
    prisma.user.count({ where: { isDraft: false } }),
    prisma.product.count(),
    prisma.trade.count({ where: { status: 'COMPLETED' } }),
    prisma.trade.aggregate({
      where: { status: { in: ['FUNDED', 'DELIVERED', 'COMPLETED'] } },
      _sum: { amount: true }
    }),
    prisma.review.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: { select: { name: true, username: true } },
        seller: { select: { name: true, storeName: true } }
      }
    })
  ]);

  res.status(200).json({
    stats: {
      totalTraders,
      totalProducts,
      completedTrades,
      totalEscrowedAmount: Number(escrowAgg._sum.amount ?? 0)
    },
    reviews: recentReviews
  });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = listProductsQuerySchema.parse(req.query);
  const result = await listProducts(query, req.user?.id ?? null);
  res.status(200).json(result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { id } = productIdParamSchema.parse(req.params);
  const product = await getProductById(id);
  res.status(200).json({ product });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = productIdParamSchema.parse(req.params);
  if (id.startsWith('trade:')) {
    const rawTradeId = id.replace(/^trade:/, '');
    const trade = await prisma.trade.findUnique({ where: { id: rawTradeId } });
    if (!trade) {
      throw new ApiError(404, 'Trade not found');
    }
    if (trade.creatorId !== user.id && user.role !== 'admin') {
      throw new ApiError(403, 'You can only update your own trade listings');
    }
    const updated = await prisma.trade.update({
      where: { id: rawTradeId },
      data: req.body?.visibility ? { visibility: req.body.visibility } : {},
      include: {
        creator: { select: { id: true, username: true, name: true, avatarColor: true } }
      }
    });
    res.status(200).json({
      product: {
        id: `trade:${updated.id}`,
        title: updated.title,
        price: Number(updated.amount),
        category: updated.category,
        condition: updated.condition || 'NEW',
        visibility: updated.visibility,
        description: updated.description || '',
        image: updated.image || '',
        images: updated.image ? [updated.image] : [],
        stock: 1,
        location: updated.takeOffLocation || null,
        sellerId: updated.creatorId,
        seller: updated.creator,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      }
    });
    return;
  }
  const input = updateProductSchema.parse(req.body);
  const product = await updateProduct(id, user.id, user.role, input);
  res.status(200).json({ product });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = productIdParamSchema.parse(req.params);
  if (id.startsWith('trade:')) {
    await deleteOwnTrade(id.replace(/^trade:/, ''), user.id);
    res.status(204).send();
    return;
  }
  await deleteProduct(id, user.id, user.role);
  res.status(204).send();
});