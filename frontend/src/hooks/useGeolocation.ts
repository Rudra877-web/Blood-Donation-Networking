import { useState } from 'react';

export interface Coords { latitude: number; longitude: number }

/** Browser Geolocation wrapper. Never throws: if permission is denied the caller keeps using manual city entry. */
export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = (): Promise<Coords | null> =>
    new Promise((resolve) => {
      if (!('geolocation' in navigator)) { setError('Geolocation is not supported by this browser. Enter your city manually.'); return resolve(null); }
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLoading(false); resolve({ latitude: +pos.coords.latitude.toFixed(6), longitude: +pos.coords.longitude.toFixed(6) }); },
        (err) => {
          setLoading(false);
          setError(err.code === err.PERMISSION_DENIED ? 'Location permission denied. You can enter your city manually.' : 'Could not detect location. Enter your city manually.');
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 10000 },
      );
    });

  return { locate, loading, error };
}
