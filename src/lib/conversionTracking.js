export const GOOGLE_ADS_REGISTRATION_CONVERSION = {
  send_to: 'AW-18249604362/pdwYCL7NtsUcEIq6i_5D',
  value: 1.0,
  currency: 'USD',
};

export const GOOGLE_ADS_MENU_UPLOAD_CONVERSION = {
  send_to: 'AW-18249604362/ybNDCKeDosUcEIq6i_5D',
  value: 1.0,
  currency: 'USD',
};

export const GOOGLE_ANALYTICS_MEASUREMENT_ID = 'G-5FYQQ4XJ98';

const trackGoogleAnalyticsEvent = (eventName, parameters = {}) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', eventName, {
    ...parameters,
    send_to: GOOGLE_ANALYTICS_MEASUREMENT_ID,
  });
};

const trackGoogleAdsConversion = (conversion) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', 'conversion', conversion);
};

const trackMetaPixelEvent = (eventName, parameters = {}) => {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') {
    return;
  }

  window.fbq('track', eventName, parameters);
};

export const trackRegistrationConversion = () => {
  trackGoogleAdsConversion(GOOGLE_ADS_REGISTRATION_CONVERSION);
  trackGoogleAnalyticsEvent('sign_up', {
    method: 'account_registration',
  });
  trackMetaPixelEvent('CompleteRegistration', {
    content_name: 'account_registration',
    value: 1.0,
    currency: 'USD',
  });
};

export const trackMenuUploadConversion = () => {
  trackGoogleAdsConversion(GOOGLE_ADS_MENU_UPLOAD_CONVERSION);
  trackGoogleAnalyticsEvent('generate_lead', {
    content_name: 'menu_upload_completed',
    value: 1.0,
    currency: 'USD',
  });
  trackMetaPixelEvent('Lead', {
    content_name: 'menu_upload_completed',
    value: 1.0,
    currency: 'USD',
  });
};

export const trackPaymentMethodAddedConversion = ({ planName, subscriptionStatus } = {}) => {
  trackGoogleAnalyticsEvent('add_payment_info', {
    payment_type: 'card',
    content_name: 'stripe_payment_method_added',
    content_category: planName || 'subscription',
    status: subscriptionStatus || 'unknown',
    value: 0,
    currency: 'USD',
  });
  trackMetaPixelEvent('AddPaymentInfo', {
    content_name: 'stripe_payment_method_added',
    content_category: planName || 'subscription',
    status: subscriptionStatus || 'unknown',
    value: 0,
    currency: 'USD',
  });
};
