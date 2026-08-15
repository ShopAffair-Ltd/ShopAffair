import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
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

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = listProductsQuerySchema.parse(req.query);
  const result = await listProducts(query);
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
  const input = updateProductSchema.parse(req.body);
  const product = await updateProduct(id, user.id, user.role, input);
  res.status(200).json({ product });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { id } = productIdParamSchema.parse(req.params);
  await deleteProduct(id, user.id, user.role);
  res.status(204).send();
});