import React from 'react';
import myxss from './myxss';

const ComponentLabel = (props) => {
  if (props.data.usePlaceholderAsLabel) {
    return null;
  }
  const hasRequiredLabel = (props.data.hasOwnProperty('required') && props.data.required === true && !props.read_only);
  const labelText = myxss.process(props.data.label);
  if (!labelText) {
    return null;
  }
  return (
    <label className={props.className || 'form-label'}>
      <span dangerouslySetInnerHTML={{ __html: labelText }} style={{ paddingRight: 0 }}/>
      {hasRequiredLabel && <span className='required-asterisk' style={{ padding: 0 }}>{'  '}*</span>}
    </label>
  );
};

export default ComponentLabel;
