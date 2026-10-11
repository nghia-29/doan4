import apiClient from './apiClient';
import { request } from './apiClient';

export async function uploadMedicineImage(asset) {
  const formData = new FormData();
  if (asset.file) {
    formData.append('image', asset.file);
  } else {
    formData.append('image', {
      uri: asset.uri,
      name: asset.fileName || `medicine-${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    });
  }

  const result = await request('/thuoc/images', { method: 'POST', body: formData });
  if (/^https?:\/\//i.test(result.url)) return result;

  const apiOrigin = apiClient.baseUrl.replace(/\/api\/?$/, '');
  return { ...result, url: `${apiOrigin}${result.url}` };
}