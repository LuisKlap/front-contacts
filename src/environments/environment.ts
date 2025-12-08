export const environment = {
  production: false,
  apiUrl: (typeof window !== 'undefined' && (window as any)['ENV']?.['API_URL'])
    || 'http://localhost:8080/api',
  googleMapsApiKey: (typeof window !== 'undefined' && (window as any)['ENV']?.['API_KEY'])
    || 'AIzaSyBbpEjrY50sEeSr6b0Eq0Yg6qzUavA9dLY'
};
