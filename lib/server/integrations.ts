import type { CourierConfig, FacebookPixelConfig, Order } from '@/types';
import type { IntegrationTestResult, SendCourierResult } from '@/types/admin';

/**
 * Every outward-facing integration (Steadfast, Pathao, Telegram, Facebook CAPI) goes through this module.
 * DEFAULT = SIMULATED: nothing leaves this machine, no real parcel is booked, no real message is sent.
 * Real calls happen only when the server is started with ENABLE_LIVE_INTEGRATIONS=true (see .env.example).
 * The seed snapshot contains REAL credentials and `autoSendOnConfirm: true`, so this gate is a safety requirement, not a nicety.
 */
export const liveIntegrationsEnabled = (): boolean => process.env.ENABLE_LIVE_INTEGRATIONS === 'true';

const SIM = '[SIMULATED] ';

/* ------------------------------------------------------------------- courier */

export async function dispatchCourier(order: Order, config: CourierConfig, provider: 'steadfast' | 'pathao'): Promise<SendCourierResult> {
  const label = provider === 'steadfast' ? 'Steadfast' : 'Pathao';

  if (provider === 'steadfast' && (!config.steadfast.apiKey || !config.steadfast.secretKey)) {
    return { success: false, provider, message: 'Steadfast API Key এবং Secret Key কনফিগার করা নেই। অনুগ্রহ করে Settings থেকে যুক্ত করুন।', error: 'Missing API credentials' };
  }
  if (provider === 'pathao' && (!config.pathao.clientId || !config.pathao.clientSecret || !config.pathao.username || !config.pathao.password)) {
    return { success: false, provider, message: 'Pathao ক্রেডেনশিয়াল (Client ID, Secret, Username, Password) কনফিগার করা নেই।', error: 'Missing Pathao credentials' };
  }

  if (!liveIntegrationsEnabled()) {
    const stamp = Date.now().toString(36).toUpperCase();
    const id = `SIMULATED-${provider === 'steadfast' ? 'STF' : 'PTH'}-${stamp}`;
    return {
      success: true,
      simulated: true,
      provider,
      consignmentId: id,
      trackingCode: id,
      status: 'simulated',
      message: `${SIM}${label} এ কোনো আসল পার্সেল বুক করা হয়নি (ENABLE_LIVE_INTEGRATIONS চালু নেই)।`,
      raw: { simulated: true, orderId: order.id },
    };
  }

  try {
    return provider === 'steadfast' ? await liveSteadfast(order, config.steadfast) : await livePathao(order, config.pathao);
  } catch (e: any) {
    return { success: false, provider, message: e?.message || 'সার্ভারের সাথে যোগাযোগ করা সম্ভব হয়নি।', error: e?.message };
  }
}

function courierPayloadBits(order: Order) {
  const customerName = order.customer?.fullName || order.customerName || 'Customer';
  const customerPhone = (order.customer?.phone || order.customerPhone || '').replace(/[^0-9]/g, '');
  const customerAddress = order.customer?.address || order.deliveryAddress || '';
  const invoice = (order.id || order.trackingCode || `ABP-${Date.now()}`).slice(-20);
  const pm = order.paymentMethod;
  const codAmount = pm === 'COD' || pm === 'cod' || !pm ? Number(order.total || order.totalAmount || 0) : 0;
  return { customerName, customerPhone, customerAddress, invoice, codAmount };
}

async function liveSteadfast(order: Order, cfg: CourierConfig['steadfast']): Promise<SendCourierResult> {
  const host = (cfg.baseUrl?.trim() || 'https://portal.steadfast.com.bd').replace(/\/$/, '');
  const b = courierPayloadBits(order);
  const res = await fetch(`${host}/api/v1/create_order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Api-Key': cfg.apiKey, 'Secret-Key': cfg.secretKey },
    body: JSON.stringify({ invoice: b.invoice, recipient_name: b.customerName, recipient_phone: b.customerPhone, recipient_address: b.customerAddress, cod_amount: b.codAmount, note: order.notes || 'Al Barakah Premium Order' }),
  });
  const data: any = await res.json().catch(() => null);
  if (!res.ok || (data && data.status !== 200 && data.status !== 'success' && !data.consignment)) {
    const err = data?.message || data?.errors || `Steadfast API Error (HTTP ${res.status})`;
    return { success: false, provider: 'steadfast', message: typeof err === 'object' ? JSON.stringify(err) : err, error: String(err), raw: data };
  }
  const c = data?.consignment || {};
  const tracking = c.tracking_code || c.consignment_id || data?.tracking_code || '';
  return { success: true, provider: 'steadfast', consignmentId: String(c.consignment_id || data?.consignment_id || tracking), trackingCode: String(tracking), status: c.status || 'in_review', message: 'Steadfast কুরিয়ারে সফলভাবে এন্ট্রি সম্পন্ন হয়েছে!', raw: data };
}

async function livePathao(order: Order, cfg: CourierConfig['pathao']): Promise<SendCourierResult> {
  const host = (cfg.baseUrl?.trim() || 'https://api-hermes.pathao.com').replace(/\/$/, '');
  const tokenRes = await fetch(`${host}/aladdin/api/v1/issue-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: cfg.clientId, client_secret: cfg.clientSecret, username: cfg.username, password: cfg.password, grant_type: 'password' }),
  });
  const tokenData: any = await tokenRes.json().catch(() => null);
  if (!tokenRes.ok || !tokenData?.access_token) {
    const err = tokenData?.message || tokenData?.error_description || 'Pathao Authentication Failed';
    return { success: false, provider: 'pathao', message: `Pathao Auth Error: ${err}`, error: String(err), raw: tokenData };
  }
  const b = courierPayloadBits(order);
  const createRes = await fetch(`${host}/aladdin/api/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${tokenData.access_token}` },
    body: JSON.stringify({
      store_id: Number(cfg.storeId) || undefined,
      merchant_order_id: b.invoice,
      recipient_name: b.customerName,
      recipient_phone: b.customerPhone,
      recipient_address: b.customerAddress,
      recipient_city: 1,
      recipient_zone: 1,
      delivery_type: 48,
      item_type: 2,
      special_instruction: order.notes || 'Al Barakah Premium Delivery',
      item_quantity: order.items?.length || 1,
      item_weight: '0.5',
      amount_to_collect: b.codAmount,
      item_description: order.items?.map((it: any) => it.name || it.productNameSnapshot || 'Product').join(', ') || 'Al Barakah Products',
    }),
  });
  const created: any = await createRes.json().catch(() => null);
  if (!createRes.ok || !created?.data?.consignment_id) {
    const err = created?.message || created?.errors || 'Failed to create Pathao order';
    return { success: false, provider: 'pathao', message: typeof err === 'object' ? JSON.stringify(err) : err, error: String(err), raw: created };
  }
  return { success: true, provider: 'pathao', consignmentId: String(created.data.consignment_id), trackingCode: String(created.data.consignment_id), status: created.data.order_status || 'Pending', message: 'Pathao কুরিয়ারে সফলভাবে এন্ট্রি সম্পন্ন হয়েছে!', raw: created };
}

/* ------------------------------------------------------------------ telegram */

export async function testTelegram(botToken: string, chatId: string): Promise<IntegrationTestResult> {
  if (!botToken || !chatId) return { success: false, simulated: false, message: 'বট টোকেন এবং চ্যাট আইডি দুটোই পূরণ করতে হবে!' };
  if (!liveIntegrationsEnabled()) {
    return { success: true, simulated: true, message: `${SIM}টেলিগ্রামে কোনো আসল মেসেজ পাঠানো হয়নি (ENABLE_LIVE_INTEGRATIONS চালু নেই)।` };
  }
  const text = `🔔 <b>[AL BARAKAH PREMIUM] টেস্ট অ্যালার্ট</b>\n━━━━━━━━━━━━━━━━━━━━\nঅভিনন্দন! আপনার টেলিগ্রাম নোটিফিকেশন সফলভাবে কানেক্ট হয়েছে। 🚀\n\n⏰ <i>${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}</i>`;
  try {
    const resp = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId.trim(), text, parse_mode: 'HTML' }),
    });
    const data: any = await resp.json();
    return data.ok
      ? { success: true, simulated: false, message: 'টেলিগ্রামে টেস্ট মেসেজ সফলভাবে পাঠানো হয়েছে!' }
      : { success: false, simulated: false, message: data.description || 'টেলিগ্রাম বটের টোকেন বা চ্যাট আইডি সঠিক নয়।' };
  } catch (e: any) {
    return { success: false, simulated: false, message: e?.message || 'টেলিগ্রাম সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।' };
  }
}

/* ------------------------------------------------------------------ facebook */

export async function testFacebookEvent(config: FacebookPixelConfig, eventName: string, customData: Record<string, any>): Promise<IntegrationTestResult> {
  if (!liveIntegrationsEnabled()) {
    return { success: true, simulated: true, message: `${SIM}ফেসবুকে কোনো আসল ইভেন্ট পাঠানো হয়নি (ENABLE_LIVE_INTEGRATIONS চালু নেই)।` };
  }
  if (!config.pixelId || !config.enableCapi || !config.accessToken) {
    return { success: true, simulated: false, message: 'ব্রাউজার-ভিত্তিক ইভেন্ট (CAPI বন্ধ বা টোকেন নেই), সার্ভার থেকে কিছু পাঠানো হয়নি।' };
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${config.pixelId}/events?access_token=${encodeURIComponent(config.accessToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{ event_name: eventName, event_time: Math.floor(Date.now() / 1000), action_source: 'website', event_id: `test-${eventName.toLowerCase()}-${Date.now()}`, custom_data: customData }],
        ...(config.testEventCode ? { test_event_code: config.testEventCode } : {}),
      }),
    });
    return { success: res.ok, simulated: false, message: res.ok ? 'CAPI ইভেন্ট পাঠানো হয়েছে।' : `CAPI Error (HTTP ${res.status})` };
  } catch (e: any) {
    return { success: false, simulated: false, message: e?.message || 'CAPI তে সংযোগ ব্যর্থ।' };
  }
}
