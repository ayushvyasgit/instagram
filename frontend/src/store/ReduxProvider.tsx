'use client';

import { Provider } from 'react-redux';
import { store } from './index';
import { hydrateAuth, loadAuthFromStorage } from './authSlice';
import { ReactNode, useEffect } from 'react';

export default function ReduxProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateAuth(loadAuthFromStorage()));
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
