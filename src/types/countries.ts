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
