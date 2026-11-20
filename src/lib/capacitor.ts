/**
 * Safe Capacitor Runtime Bridge
 * Works universally across both native mobile WebView and standard web environments
 * without requiring @capacitor/core to be installed on production web servers.
 */

export const isNativePlatform = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any)?.Capacitor?.isNativePlatform?.() ||
    (window as any)?.Capacitor?.getPlatform?.() === 'android' ||
    (window as any)?.Capacitor?.getPlatform?.() === 'ios'
  );
};

export const getPlatform = (): string => {
  if (typeof window === 'undefined') return 'web';
  return (window as any)?.Capacitor?.getPlatform?.() || 'web';
};

export const Capacitor = {
  isNativePlatform,
  getPlatform,
  isPluginAvailable: (name: string): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any)?.Capacitor?.isPluginAvailable?.(name));
  },
};

export default Capacitor;
