import SimplePublicMenuSkeleton from './templates/SimplePublicMenuSkeleton.jsx';
import ExtendedPublicMenuSkeleton from './templates/ExtendedPublicMenuSkeleton.jsx';
import { normalizeTemplateType } from '../../lib/publicMenuUtils';

const SKELETON_COMPONENTS = {
  simple: SimplePublicMenuSkeleton,
  extended: ExtendedPublicMenuSkeleton,
  premium: SimplePublicMenuSkeleton,
};

const PublicMenuSkeletonRenderer = ({ templateType = 'simple', accentColor = '#6d67eb' }) => {
  const normalizedTemplateType = normalizeTemplateType(templateType);
  const SkeletonComponent = SKELETON_COMPONENTS[normalizedTemplateType] || SKELETON_COMPONENTS.simple;

  return <SkeletonComponent accentColor={accentColor} />;
};

export default PublicMenuSkeletonRenderer;
