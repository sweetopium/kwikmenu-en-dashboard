import SimplePublicMenuTemplate from './templates/SimplePublicMenuTemplate.jsx';
import ExtendedPublicMenuTemplate from './templates/ExtendedPublicMenuTemplate.jsx';
import BrandedPublicMenuTemplate from './templates/BrandedPublicMenuTemplate.jsx';
import { normalizeTemplateType } from '../../lib/publicMenuUtils';

const TEMPLATE_COMPONENTS = {
  simple: SimplePublicMenuTemplate,
  extended: ExtendedPublicMenuTemplate,
  premium: BrandedPublicMenuTemplate,
};

const PublicMenuTemplateRenderer = (props) => {
  const templateType = normalizeTemplateType(
    props.venue?.design?.template || props.menu?.payload?.settings?.templateType
  );
  const TemplateComponent = TEMPLATE_COMPONENTS[templateType] || TEMPLATE_COMPONENTS.simple;

  return <TemplateComponent {...props} templateType={templateType} />;
};

export default PublicMenuTemplateRenderer;
