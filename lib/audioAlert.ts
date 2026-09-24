/**
 * Web Audio API Synthesizer for Real-Time Order Alerts
 * Generates crisp, pleasant, zero-latency notification sounds without external audio files.
 */

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioContext = new AudioCtx();
      }
    }
    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  } catch (e) {
    console.warn('AudioContext initialization notice:', e);
    return null;
  }
}

/**
 * Play a synthesized sound alert for new orders
 */
export function playOrderAlertSound(type: 'cash' | 'chime' | 'bell' = 'cash'): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === 'cash') {
      // Cash Register "Ka-Ching" sound
      // Coin strike 1 (B5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(987.77, now);
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Coin strike 2 (E6) - higher bell chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.09);
      osc2.frequency.exponentialRampToValueAtTime(1396.91, now + 0.3);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0, now + 0.09);
      gain2.gain.linearRampToValueAtTime(0.45, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.85);

      // Sparkle overtone (E7) - shimmer
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(2637.02, now + 0.1);

      gain3.gain.setValueAtTime(0, now);
      gain3.gain.setValueAtTime(0, now + 0.1);
      gain3.gain.linearRampToValueAtTime(0.2, now + 0.11);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.1);
      osc3.stop(now + 0.7);
    } else if (type === 'chime') {
      // Pleasant Crystal Bell Chime (C5, E5, G5, C6 arpeggio)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.65);
      });
    } else {
      // Service Counter Bell (Ding)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1174.66, now); // D6
      osc.frequency.exponentialRampToValueAtTime(1185, now + 0.4);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    }
  } catch (err) {
    console.warn('Error playing audio alert:', err);
  }
}

/**
 * Request permission for browser push notifications
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Browser notification permission error:', err);
    return Notification.permission || 'denied';
  }
}

/**
 * Display a native browser notification for a new order
 */
export function showBrowserOrderNotification(order: {
  id: string;
  trackingCode?: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: number;
  total?: number;
  paymentMethod?: string;
}): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const orderId = order.trackingCode || order.id;
    const amount = (order.totalAmount || order.total || 0).toLocaleString();
    const customer = order.customerName || 'Customer';
    const phone = order.customerPhone ? ` (${order.customerPhone})` : '';

    const notification = new Notification(`🛒 নতুন অর্ডার এসেছে! #${orderId}`, {
      body: `গ্রাহক: ${customer}${phone}\nমোট মূল্য: ৳${amount}\nপদ্ধতি: ${order.paymentMethod || 'Cash On Delivery'}`,
      icon: '/favicon.ico',
      tag: `order-${order.id}`,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('Failed to show browser notification:', err);
    return false;
  }
}
