import { CaptionResponse } from './caption.types';

export interface CaptionsListResponse {
  words: CaptionResponse[];
  total: number;
  page?: number;
  limit?: number;
}

