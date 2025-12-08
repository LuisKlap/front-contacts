export const environment = {
  production: false,
  apiUrl: (typeof window !== 'undefined' && (window as any)['ENV']?.['API_URL'])
    || 'http://localhost:8080/api'
};
