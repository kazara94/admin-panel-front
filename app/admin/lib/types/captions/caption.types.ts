import { BaseResource } from '../baseResource.types';

export type CaptionData = {
  national: string;
  foreign: string;
};

export interface CaptionType extends BaseResource {
  _id?: string | number;
  national: string;
  foreign: string;
}

export interface CaptionResponse {
  id: string | number;
  national: string;
  foreign: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Transformed caption response from the API response handler.
 * This represents the actual structure returned by the response handler
 * after transforming the raw API response.
 */
export interface TransformedCaptionResponse {
  id: string | number;
  national: string;
  foreign: string;
  created_at: string;
  updated_at: string;
  isFavorite: boolean;
  inSentences: unknown[];
}

export * from './baseApiType.types';

