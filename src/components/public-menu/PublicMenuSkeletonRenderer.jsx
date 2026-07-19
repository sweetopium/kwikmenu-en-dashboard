import SimplePublicMenuSkeleton from './templates/SimplePublicMenuSkeleton.jsx';

const PublicMenuSkeletonRenderer = ({ accentColor = '#6d67eb' }) => {
  return <SimplePublicMenuSkeleton accentColor={accentColor} />;
};

export default PublicMenuSkeletonRenderer;
