import crypto from 'crypto';
import { prisma } from '../../config/db';
import { ApiError } from '../../utils/ApiError';
import type { CheckoutInput, ListOrdersQuery } from './orders.validation';

const generatePickupCode = () => crypto.randomInt(100000, 999999).toString();
const generateOrderRef = () => `ORD-${crypto.randomInt(100000, 999999)}`;


export const checkout = async (buyerId: string, input: CheckoutInput) => {
  const orderRef = generateOrderRef();

  return prisma.$transaction(async (tx) => {
    const createdOrders = [];

    for (const item of input.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });

      if (!product) {
        throw new ApiError(404, `Product ${item.productId} not found`);
      }
      if (product.sellerId === buyerId) {
        throw new ApiError(400, `You cannot purchase your own product: ${product.title}`);
      }

      const lineTotal = Number(product.price) * item.quantity;

      const trade = await tx.trade.create({
        data: {
          title: `Escrow Order: ${product.title}`,
          creatorId: product.sellerId,
          buyerId,
          amount: lineTotal,
          status: 'FUNDED',
          type: 'SUPPLY',
          category: 'PHYSICAL',
          condition: product.condition,
          specs: {
            Quantity: String(item.quantity),
            'Order Ref': orderRef,
            Recipient: input.fullName,
            Address: `${input.address}, ${input.city}, ${input.state}`
          },
          deliveryFee: input.deliveryFee,
          deliveryTime: '2-4 days',
          takeOffLocation: 'ShopFair Hub',
          deliveryLocation: `${input.city}, ${input.state}`,
          image: product.image,
          description: `Order ${orderRef} — ${item.quantity}x ${product.title}`,
          pickupCode: generatePickupCode(),
          pickupAttempts: 0
        }
      });

      const order = await tx.order.create({
        data: {
          orderRef,
          productId: product.id,
          price: product.price,
          quantity: item.quantity,
          buyerId,
          sellerId: product.sellerId,
          status: 'PAID',
          deliveryFee: input.deliveryFee,
          fullName: input.fullName,
          address: input.address,
          city: input.city,
          state: input.state,
          phone: input.phone,
          tradeId: trade.id
        },
        include: {
          product: { select: { id: true, title: true, image: true } },
          trade: { select: { id: true, pickupCode: true, status: true } }
        }
      });

      createdOrders.push(order);
    }

    return { orderRef, orders: createdOrders };
  });
};

export const listOrders = async (userId: string, query: ListOrdersQuery) => {
  const { page, limit, status, role } = query;

  const where = {
    ...(role === 'buyer' ? { buyerId: userId } : { sellerId: userId }),
    ...(status ? { status } : {})
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, title: true, image: true } },
        buyer: { select: { id: true, username: true, name: true } },
        seller: { select: { id: true, username: true, name: true } },
        trade: { select: { id: true, pickupCode: true, status: true } }
      }
    }),
    prisma.order.count({ where })
  ]);

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getOrderById = async (id: string, userId: string, userRole: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, title: true, image: true } },
      buyer: { select: { id: true, username: true, name: true } },
      seller: { select: { id: true, username: true, name: true } },
      trade: { select: { id: true, pickupCode: true, status: true, pickupAttempts: true } }
    }
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  if (order.buyerId !== userId && order.sellerId !== userId && userRole !== 'admin') {
    throw new ApiError(403, 'You do not have permission to view this order');
  }

  return order;
};

export const updateOrderStatus = async (
  id: string,
  userId: string,
  userRole: string,
  status: string
) => {
  const order = await prisma.order.findUnique({ where: { id } });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  if (order.sellerId !== userId && userRole !== 'admin') {
    throw new ApiError(403, 'Only the seller can update this order status');
  }

  return prisma.order.update({
    where: { id },
    data: { status: status as never }
  });
};