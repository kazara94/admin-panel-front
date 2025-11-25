'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { getAuthToken, removeAuthToken, isAuthenticated } from '@/app/admin/global/core/auth';
import { UserType } from '@/app/admin/lib/types';

interface UserState {
  user: UserType | null;
  isAuthenticated: boolean;
  loading: boolean;
}

type UserAction = 
  | { type: 'SET_USER'; payload: UserType }
  | { type: 'REGISTER_SUCCESS'; payload: UserType }
  | { type: 'LOGIN_SUCCESS'; payload: UserType }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_USER':
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      if (typeof window !== 'undefined') {
        removeAuthToken();
        localStorage.removeItem('userData');
      }
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

const UserContext = createContext<{
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
} | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  const checkExistingAuth = () => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken();
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        if (isAuthenticated()) {
          try {
            const user = JSON.parse(userData);
            dispatch({ type: 'SET_USER', payload: user });
          } catch {
            removeAuthToken();
            localStorage.removeItem('userData');
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          removeAuthToken();
          localStorage.removeItem('userData');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else if (token) {
        removeAuthToken();
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    checkExistingAuth();
  }, []);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
