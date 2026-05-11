import { Navigate } from 'react-router-dom';

const ActiveVenueQrRedirect = () => {
  const activeVenueId = typeof window !== 'undefined'
    ? window.localStorage.getItem('kwikmenu-active-venue')
    : null;

  if (!activeVenueId) {
    return <Navigate to="/dashboard/venues" replace />;
  }

  return <Navigate to={`/dashboard/venues/${activeVenueId}?tab=qr`} replace />;
};

export default ActiveVenueQrRedirect;
