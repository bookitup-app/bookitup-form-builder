import React from 'react';
import myxss from './myxss';
import IntlMessages from '../language-provider/IntlMessages';

const ComponentLabel = (props) => {
  const hasRequiredLabel = (props.data.hasOwnProperty('required') && props.data.required === true && !props.read_only);
  const labelText = myxss.process(props.data.label);
  if (!labelText) {
    return null;
  }
  return (
    <label className={props.className || 'form-label'}>
      <span dangerouslySetInnerHTML={{ __html: labelText }}/>
      {hasRequiredLabel && <span className="label-required badge badge-danger"><IntlMessages id='required' /></span>}
    </label>
  );
};

export default ComponentLabel;
