import { useState, useEffect, useCallback } from 'react';
import { checkQlooHealth } from '@/lib/qloo-client';
import type { QlooStatus } from '@/lib/types';

export function useQlooStatus() {
  const [status, setStatus] = useState<QlooStatus>('checking');
  const [message, setMessage] = useState<string>('Checking Qloo connectivity...');

  const check = useCallback(async () => {
    setStatus('checking');
    setMessage('Checking Qloo connectivity...');
    const res = await checkQlooHealth();
    if (!res.ok) {
      setStatus('error');
      setMessage(res.error || 'Failed to check Qloo status');
      return;
    }
    const data = res.data;
    if (data?.status === 'connected') {
      setStatus('connected');
      setMessage(data.message);
    } else if (data?.status === 'not_configured') {
      setStatus('not-configured');
      setMessage(data.message);
    } else if (data?.status === 'error') {
      setStatus('error');
      setMessage(data.message);
    } else {
      setStatus('disconnected');
      setMessage(data?.message || 'Qloo status unknown');
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { status, message, check };
}
