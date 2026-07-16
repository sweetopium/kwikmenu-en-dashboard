import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { GOOGLE_ANALYTICS_MEASUREMENT_ID } from '../../lib/conversionTracking.js';

const GoogleAnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }

    const pagePath = location.pathname || '/';

    window.gtag('event', 'page_view', {
      page_location: `${window.location.origin}${pagePath}`,
      page_path: pagePath,
      page_title: document.title,
      send_to: GOOGLE_ANALYTICS_MEASUREMENT_ID,
    });
  }, [location.pathname]);

  return null;
};

export default GoogleAnalyticsTracker;
