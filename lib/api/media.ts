import { post } from './http';

interface UploadSignature {
  apiKey: string;
  uploadUrl: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
}

interface CloudinaryAsset {
  public_id?: string;
  version?: number;
  signature?: string;
  secure_url?: string;
  url?: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  error?: { message?: string };
}

interface RegisteredMedia {
  secureUrl: string;
}

/**
 * Cropped product photos leave the form as `data:image/...` strings. The product API only accepts
 * an http(s) URL that was registered through `/v1/admin/media`, and rejects anything over 1000 characters.
 * Upload the file to Cloudinary with the server signature, register it, and return the short secure URL.
 * An address that is already http(s) is returned unchanged.
 */
export async function uploadImageDataUrl(dataUrl: string, folder: 'products' | 'categories' | 'banners' | 'seo' | 'misc' = 'products'): Promise<string> {
  if (!dataUrl.startsWith('data:')) return dataUrl;

  const sign = await post<UploadSignature>('/v1/admin/media/sign', { folder });
  const blob = await (await fetch(dataUrl)).blob();
  const form = new FormData();
  form.append('file', blob);
  form.append('api_key', sign.apiKey);
  form.append('timestamp', String(sign.timestamp));
  form.append('signature', sign.signature);
  form.append('folder', sign.folder);
  form.append('allowed_formats', sign.allowedFormats);

  const res = await fetch(sign.uploadUrl, { method: 'POST', body: form });
  const asset = (await res.json().catch(() => ({}))) as CloudinaryAsset;
  if (!res.ok || !asset.public_id || !asset.secure_url || !asset.signature || asset.version == null) {
    throw new Error(asset.error?.message || 'ছবি আপলোড হয়নি। আবার চেষ্টা করুন।');
  }

  const saved = await post<RegisteredMedia>('/v1/admin/media', {
    publicId: asset.public_id,
    version: asset.version,
    signature: asset.signature,
    secureUrl: asset.secure_url,
    ...(asset.url ? { url: asset.url } : {}),
    resourceType: 'image',
    ...(asset.format ? { format: asset.format } : {}),
    ...(typeof asset.bytes === 'number' ? { bytes: asset.bytes } : {}),
    ...(typeof asset.width === 'number' ? { width: asset.width } : {}),
    ...(typeof asset.height === 'number' ? { height: asset.height } : {}),
  });
  return saved.secureUrl;
}
