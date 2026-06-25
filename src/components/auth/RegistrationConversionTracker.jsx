import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { trackRegistrationConversion } from '../../lib/conversionTracking.js';

const REGISTRATION_CONVERSION_PARAM = 'registration_conversion';

const RegistrationConversionTracker = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get(REGISTRATION_CONVERSION_PARAM) !== '1') {
      return;
    }

    trackRegistrationConversion();
    params.delete(REGISTRATION_CONVERSION_PARAM);
    const nextSearch = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
        hash: location.hash,
      },
      { replace: true },
    );
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
};

export default RegistrationConversionTracker;
