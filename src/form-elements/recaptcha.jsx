import React from 'react';
import Reaptcha from 'reaptcha';
import ComponentHeader from './component-header';
import ComponentLabel from './component-label';

class Recaptcha extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        captchaReady: false,
        verified: false,
        response: null,
      };
    }

    onLoad = () => {
        this.setState({
          ...this.state,
          captchaReady: true,
        });
    };

    onVerify = (response) => {
      this.setState({
        ...this.state,
        verified: true,
        response,
      });
    };

    render() {
        const props = {};
        props.className = 'form-control';
        props.name = this.props.data.field_name;

        if (this.props.mutable) {
          props.defaultValue = this.props.defaultValue;
          props.ref = this.inputField;
        }

        let baseClasses = 'SortableItem rfb-item';
        if (this.props.data.pageBreakBefore) { baseClasses += ' alwaysbreak'; }

        const showValidationErrors = this.props.inlineValidation && this.props.validationMessage;

        return (
          <div className={baseClasses} style={{ ...this.props.style }}>
            <ComponentHeader {...this.props} />
            <div className="form-group">
              <ComponentLabel {...this.props} />
              <div>
              <Reaptcha sitekey={this.props.data.sitekey} onVerify={this.onVerify} onLoad={this.onLoad}/>
              </div>
              {showValidationErrors &&
                <span className='error'>{this.props.validationMessage}</span>}
            </div>
          </div>
        );
      }
}

export default Recaptcha;
