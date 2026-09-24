'use client';

import { useEffect, useState } from 'react';
import { initializePaddle, type Paddle } from '@paddle/paddle-js';

export type PaddleClientConfig = {
  token: string;
  environment: 'sandbox' | 'production';
};

/**
 * Loads Paddle.js (from Paddle's CDN) on the page that needs it and nowhere
 * else — its checkout may set its own cookies, and the privacy policy promises
 * they stay on the billing page.
 */
export function usePaddle(config: PaddleClientConfig | null): Paddle | null {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const token = config?.token;
  const environment = config?.environment;

  useEffect(() => {
    if (!token || !environment) return;
    let cancelled = false;
    initializePaddle({ token, environment })
      .then((instance) => {
        if (!cancelled && instance) setPaddle(instance);
      })
      .catch((error: unknown) => {
        console.error('[billing] Paddle.js failed to load', error);
      });
    return () => {
      cancelled = true;
    };
  }, [token, environment]);

  return paddle;
}
