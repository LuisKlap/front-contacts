export const environment = {
  production: true,
  apiUrl: (typeof window !== 'undefined' && (window as any)['ENV']?.['API_URL'])
    || 'https://backend-uex-contacts-production.up.railway.app/api',
  googleMapsApiKey: (typeof window !== 'undefined' && (window as any)['ENV']?.['API_KEY'])
    || ''
};
