import { useState } from 'react';

export function useLoadData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  return { loading, error };
}
