export interface BaseApiTypeWordResponse {
  _id: string | number;
  national: string;
  foreign: string;
  createdAt?: string;
  updatedAt?: string;
  isFavorite?: boolean;
  inSentences?: unknown[];
}

export interface BaseApiTypeWordsResponse {
  words: BaseApiTypeWordResponse[];
}

export interface BaseApiTypeResponse {
  _id: string | number;
  username: string;
  email?: string;
  token: string;
}

