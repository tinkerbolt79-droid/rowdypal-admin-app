// src/hooks/useEvents.js
import { useState, useCallback } from 'react';
import { copyUpcomingEventsMaintainHistory } from '../firebase/events-service';

export function useEvents() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const processEvents = useCallback(async () => {
    if (processing) return;

    setProcessing(true);
    setError(null);

    try {
      const data = await copyUpcomingEventsMaintainHistory();
      setResult(data);
      return data;
    } catch (err) {
      setError(err);
      console.error('Error processing events:', err);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, [processing]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    processing,
    result,
    error,
    processEvents,
    clearResult
  };
}