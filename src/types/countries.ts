export interface CountriesNowCountry {
  country: string;
  iso2: string;
  iso3?: string;
  cities: string[];
}

export interface CountriesNowResponse {
  error: boolean;
  msg?: string;
  data: CountriesNowCountry[];
}

export interface CityOption {
  originalName: string;
  displayName: string;
}

export interface CountryOption {
  iso2: string;
  originalName: string;
  displayName: string;
  cities: CityOption[];
}

/** @deprecated Prefer CountryOption from the translated countries flow. */
export interface CountryData {
  country: string;
  cities: string[];
}

export interface CountriesApiItem {
  country: string;
  cities: string[];
}

export interface CountriesApiResponse {
  error: boolean;
  msg: string;
  data: CountriesApiItem[];
}
