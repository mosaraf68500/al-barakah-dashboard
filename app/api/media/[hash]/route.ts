import { getMedia } from '@/lib/server/adminStore';

// TEMP: Phase 2 only - serves images lifted out of the seed data's base64 data URLs.
export async function GET(_req: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  const media = getMedia(hash);
  if (!media) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(media.buffer), {
    headers: { 'Content-Type': media.mime, 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
