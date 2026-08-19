import { api } from './api';

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await api.post<{ url: string; publicId: string }>('/uploads/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return data.url;
};