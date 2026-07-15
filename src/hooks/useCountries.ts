import { useCallback, useEffect, useRef, useState } from 'react';
import { loadConfig } from '../services/configService';
import { clearCountriesCache, fetchCountries } from '../services/countriesService';
import type { CountryOption } from '../types/countries';

interface UseCountriesResult {
  countries: CountryOption[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const LOCATION_ERROR =
  'No se pudieron cargar los países y ciudades. Inténtalo de nuevo.';

export function useCountries(): UseCountriesResult {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const loadedUrlRef = useRef<string | null>(null);

  const load = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const config = loadConfig();
      const apiUrl = config.countriesApiUrl.trim();

      if (loadedUrlRef.current && loadedUrlRef.current !== apiUrl) {
        clearCountriesCache();
      }

      const data = await fetchCountries(apiUrl, signal);

      if (signal.aborted) {
        return;
      }

      loadedUrlRef.current = apiUrl;
      setCountries(data);
    } catch (err) {
      if (signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
        return;
      }

      setError(LOCATION_ERROR);
      setCountries([]);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [load, attempt]);

  const retry = useCallback(() => {
    clearCountriesCache();
    setAttempt((current) => current + 1);
  }, []);

  return { countries, loading, error, retry };
}
