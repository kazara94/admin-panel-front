export interface CountryType {
  name: {
    common: string;
    official: string;
  };
  region: string;
  capital?: string[];
  currencies?: {
    [key: string]: {
      name: string;
      symbol: string;
    };
  };
  languages?: {
    [key: string]: string;
  };
  independent?: boolean;
  cca2: string;
  cca3: string;
}

