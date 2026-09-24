import type { FacebookPixelEventLog, IntegrationTestResultLike } from './pixelTypes';
import { testFacebookEvent } from '@/lib/api/settings';

/**
 * In-browser event log for the Facebook Pixel "live event tester" (same API and 50-entry / sessionStorage behaviour as the legacy
 * facebookPixelService). The admin app does NOT load the Meta pixel; a test event is recorded here and sent to
 * /api/integrations/facebook/test, which SIMULATES it unless the server runs with ENABLE_LIVE_INTEGRATIONS=true.
 */
const KEY = 'albarakah_fb_pixel_logs';
const listeners = new Set<(logs: FacebookPixelEventLog[]) => void>();
let history: FacebookPixelEventLog[] = [];

try {
  const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(KEY) : null;
  if (cached) history = JSON.parse(cached);
} catch {
  /* ignore */
}

const notify = () => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(history.slice(0, 30)));
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn([...history]));
};

export const subscribeToPixelLogs = (cb: (logs: FacebookPixelEventLog[]) => void) => {
  listeners.add(cb);
  cb([...history]);
  return () => {
    listeners.delete(cb);
  };
};

export const clearPixelLogs = () => {
  history = [];
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  notify();
};

const SAMPLE = {
  content_name: 'টেস্ট প্রিমিয়াম ঘানিভাঙা সরিষার তেল (৫ লিটার)',
  content_ids: ['prod-mustard-oil-5l'],
  content_type: 'product',
  value: 1350,
  currency: 'BDT',
};

function sampleData(eventName: string): Record<string, unknown> {
  switch (eventName) {
    case 'PageView':
      return { page: '/test-event', title: 'Al Barakah Test' };
    case 'ViewContent':
      return SAMPLE;
    case 'AddToCart':
      return { ...SAMPLE, num_items: 1 };
    case 'InitiateCheckout':
      return { content_ids: SAMPLE.content_ids, content_type: 'product', value: 1350, currency: 'BDT', num_items: 1 };
    default:
      return { content_ids: SAMPLE.content_ids, content_type: 'product', value: 1350, currency: 'BDT', order_id: `TEST-${Date.now().toString().slice(-5)}`, num_items: 1 };
  }
}

export async function sendTestPixelEvent(eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'): Promise<IntegrationTestResultLike> {
  const data = { test_mode: true, ...sampleData(eventName) };
  let result: IntegrationTestResultLike;
  try {
    result = await testFacebookEvent(eventName, data);
  } catch (e) {
    result = { success: false, simulated: false, message: e instanceof Error ? e.message : 'Request failed' };
  }
  history = [
    {
      id: `px-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      eventName: `TEST: ${eventName}`,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      data,
      method: 'Browser Pixel',
      status: 'TEST',
    },
    ...history.slice(0, 49),
  ];
  notify();
  return result;
}
