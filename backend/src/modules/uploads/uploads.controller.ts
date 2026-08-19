import type { Request, Response, NextFunction } from 'express';
import { cloudinary } from '../../config/cloudinary';
import { ApiError } from '../../utils/ApiError';

export const uploadTradeImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No image file provided');
    }

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'shopfair/trades',
          resource_type: 'image',
          transformation: [{ width: 1600, height: 1600, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }]
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id });
        }
      );
      stream.end(req.file!.buffer);
    });

    res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    next(err);
  }
};