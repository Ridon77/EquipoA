import { useCallback, useEffect, useState } from 'react';
import { loadConfig } from '../services/configService';
import { fetchCountries } from '../services/countriesService';
import type { CountryData } from '../types/countries';

interface UseCountriesResult {
  countries: CountryData[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export function useCountries(): UseCountriesResult {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const config = loadConfig();
      const data = await fetchCountries(config.countriesApiUrl);
      setCountries(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los países.';
      setError(message);
      setCountries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return { countries, loading, error, retry };
}
