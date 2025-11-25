import { UserType } from './user.types';

export type LoginData = {
  username: string;
  password: string;
};

export type RegisterData = {
  username: string;
  password: string;
  confirm_password: string;
};

export interface LoginResponse {
  token: string;
  expires_at: string;
  token_type: string;
  user: UserType;
}

export interface RegisterResponse {
  token: string;
  expires_at: string;
  token_type: string;
  user: UserType;
}

