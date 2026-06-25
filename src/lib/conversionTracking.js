export const GOOGLE_ADS_REGISTRATION_CONVERSION = {
  send_to: 'AW-18249604362/pdwYCL7NtsUcEIq6i_5D',
  value: 1.0,
  currency: 'USD',
};

export const trackRegistrationConversion = () => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', 'conversion', GOOGLE_ADS_REGISTRATION_CONVERSION);
};
