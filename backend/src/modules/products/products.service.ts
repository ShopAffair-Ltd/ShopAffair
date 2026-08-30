import { prisma } from '../../config/db';
import { Prisma } from '../../generated/prisma/client.js';
import { ApiError } from '../../utils/ApiError';
import type { CreateProductInput, UpdateProductInput, ListProductsQuery } from './products.validation';

export const createProduct = async (sellerId: string, input: CreateProductInput) => {
  return prisma.product.create({
    data: {
      title: input.title,
      price: input.price,
      image: input.image,
      category: input.category,
      condition: input.condition,
      location: input.location,
      specs: input.specs as Prisma.InputJsonValue | undefined,
      description: input.description,
      sellerId
    }
  });
};

export const listProducts = async (query: ListProductsQuery) => {
  const { page, limit, category, condition, sellerId, search, location, minPrice, maxPrice } = query;

  const where: Prisma.ProductWhereInput = {
    ...(category ? { category } : {}),
    ...(condition ? { condition } : {}),
    ...(sellerId ? { sellerId } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(location ? { location: { contains: location, mode: 'insensitive' as const } } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? { price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: { id: true, username: true, name: true, avatarColor: true, verificationStatus: true }
        }
      }
    }),
    prisma.product.count({ where })
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      seller: {
        select: { id: true, username: true, name: true, avatarColor: true, verificationStatus: true }
      }
    }
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
};

// Fetches the product and verifies the requesting user owns it (or is an admin).
// Throws 404 if the product doesn't exist (never reveals existence to a non-owner),
// and 403 if it exists but belongs to someone else.
const assertOwnership = async (productId: string, userId: string, userRole: string) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.sellerId !== userId && userRole !== 'admin') {
    throw new ApiError(403, 'You do not have permission to modify this product');
  }

  return product;
};

export const updateProduct = async (
  productId: string,
  userId: string,
  userRole: string,
  input: UpdateProductInput
) => {
  await assertOwnership(productId, userId, userRole);

  const { specs, ...rest } = input;

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...rest,
      ...(specs !== undefined ? { specs: specs as Prisma.InputJsonValue } : {})
    }
  });
};

export const deleteProduct = async (productId: string, userId: string, userRole: string) => {
  await assertOwnership(productId, userId, userRole);

  await prisma.product.delete({ where: { id: productId } });
};