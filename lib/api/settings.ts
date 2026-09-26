import type { AdminSettings, IntegrationTestResult } from '@/types/admin';
import type { TopSellingSectionConfig } from '@/types';
import { ApiError, apiFetch, patch, post } from './http';

/** `topSelling` may be a single-flag patch (`{ enabled }`). The settings merge keeps every omitted field, including the item list. */
type SettingsPatch = Partial<Omit<AdminSettings, 'topSelling'>> & {
  topSelling?: Partial<TopSellingSectionConfig> | null;
};

/** Optimistic-locking version from the last settings GET/save. Sent on every update; the backend answers 409 VERSION_CONFLICT when it is stale. */
let settingsVersion: number | undefined;
const remember = <T extends { version?: number }>(s: T): T => {
  if (typeof s?.version === 'number') settingsVersion = s.version;
  return s;
};

export const getSettings = () => apiFetch<AdminSettings>('/v1/admin/settings').then(remember);

export const saveSettings = async (partial: SettingsPatch) => {
  try {
    const body = settingsVersion === undefined ? partial : { ...partial, version: settingsVersion };
    return remember(await patch<AdminSettings>('/v1/admin/settings', body));
  } catch (e) {
    if (e instanceof ApiError && e.status === 409 && e.code === 'VERSION_CONFLICT') {
      throw new ApiError('Someone else updated the settings. Please refresh the page to load the latest settings, then try again.', 409, e.code, e.details);
    }
    throw e;
  }
};

export const testTelegram = (botToken: string, chatId: string) => post<IntegrationTestResult>('/v1/admin/integrations/telegram/test', { botToken, chatId });
export const testFacebookEvent = (eventName: string, customData?: Record<string, unknown>) =>
  post<IntegrationTestResult>('/v1/admin/integrations/facebook/test', { eventName, customData });
