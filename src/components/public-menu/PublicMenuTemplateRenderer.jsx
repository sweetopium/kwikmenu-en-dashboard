import SimplePublicMenuTemplate from './templates/SimplePublicMenuTemplate.jsx';
import { normalizeTemplateType } from '../../lib/publicMenuUtils';

const TEMPLATE_COMPONENTS = {
  simple: SimplePublicMenuTemplate,
  extended: SimplePublicMenuTemplate,
  premium: SimplePublicMenuTemplate,
};

const PublicMenuTemplateRenderer = (props) => {
  const templateType = normalizeTemplateType(props.menu?.payload?.settings?.templateType);
  const TemplateComponent = TEMPLATE_COMPONENTS[templateType] || TEMPLATE_COMPONENTS.simple;

  return <TemplateComponent {...props} templateType={templateType} />;
};

export default PublicMenuTemplateRenderer;
