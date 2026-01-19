/**
  * <Form />
  */

import React from 'react';
import ReactDOM from 'react-dom';
import { EventEmitter } from 'fbemitter';
import { injectIntl } from 'react-intl';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import de from 'date-fns/locale/de';
import en from 'date-fns/locale/en-US';
import vi from 'date-fns/locale/vi';
import Banner from './banner';
import FormValidator from './form-validator';
import FormElements from './form-elements';
import { TwoColumnRow, ThreeColumnRow, MultiColumnRow } from './multi-column';
import { FieldSet } from './fieldset';
import CustomElement from './form-elements/custom-element';
import Registry from './stores/registry';
import { BookitupUtils } from './utils/BookitupUtils';

const {
  Image, Checkboxes, Signature, Download, Camera, FileUpload, Recaptcha,
} = FormElements;

const usableLocales = {
  en,
  de,
  vi,
};
class ReactForm extends React.Component {
  form;

  inputs = {};

  state = {
    errors: {},
    showingBanner: false,
    submitOk: undefined,
    attemptingSubmit: false,
    trigger: Date.now(),
  };

  answerData;

  constructor(props) {
    super(props);
    this.answerData = this._convert(props.answer_data);
    this.requestParams = this._getRequestParams();
    this.emitter = new EventEmitter();
    this.getDataById = this.getDataById.bind(this);

    // Bind handleBlur and handleChange methods
    this.handleBlur = this.handleBlur.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  _convert(answers) {
    if (Array.isArray(answers)) {
      const result = {};
      answers.forEach(x => {
        if (x.name.indexOf('tags_') > -1) {
          result[x.name] = x.value.map(y => y.value);
        } else {
          result[x.name] = x.value;
        }
      });
      return result;
    }
    return answers || {};
  }

  _getRequestParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  }

  _getDefaultValue(item) {
    const fieldName = item.field_name;
    // 1️⃣ Explicit stored answer always wins
    if (this.answerData?.[fieldName] !== undefined) {
      return this.answerData[fieldName];
    }
    // 2️⃣ Try to prefill from request params
    if (this.requestParams && typeof fieldName === 'string') {
      const matchedKey = Object.keys(this.requestParams).find((param) => fieldName === param || fieldName.includes(param));
      if (matchedKey) {
        return this.requestParams[matchedKey];
      }
    }
    // 3️⃣ No default
    return undefined;
  }

  _optionsDefaultValue(item) {
    const defaultValue = this._getDefaultValue(item);
    if (defaultValue) {
      return defaultValue;
    }

    const defaultChecked = [];
    item.options.forEach(option => {
      if (this.answerData[`option_${option.key}`]) {
        defaultChecked.push(option.key);
      }
    });
    return defaultChecked;
  }

  _getItemValue(item, ref) {
    let $item = {
      element: item.element,
      value: '',
    };
    if (item.element === 'Rating') {
      $item.value = ref.inputField.current.state.rating;
    } else if (item.element === 'Tags') {
      $item.value = ref.inputField.current.state.value;
    } else if (item.element === 'DatePicker') {
      $item.value = ref.state.value;
    } else if (item.element === 'Camera') {
      $item.value = ref.state.img;
    } else if (item.element === 'FileUpload') {
      $item.value = ref.state.fileUpload;
    } else if (item.element === 'Recaptcha' || item.element === 'HCaptcha') {
      $item.value = ref.state.response;
    } else if (ref && ref.inputField && ref.inputField.current) {
      $item = ReactDOM.findDOMNode(ref.inputField.current);
      if ($item && typeof $item.value === 'string') {
        $item.value = $item.value.trim();
      }
    }
    return $item;
  }

  _isIncorrect(item) {
    let incorrect = false;
    if (item.canHaveAnswer) {
      const ref = this.inputs[item.field_name];
      if (item.element === 'Checkboxes' || item.element === 'RadioButtons') {
        item.options.forEach(option => {
          const $option = ReactDOM.findDOMNode(ref.options[`child_ref_${option.key}`]);
          if ((option.hasOwnProperty('correct') && !$option.checked) || (!option.hasOwnProperty('correct') && $option.checked)) {
            incorrect = true;
          }
        });
      } else {
        const $item = this._getItemValue(item, ref);
        if (item.element === 'Rating') {
          if ($item.value.toString() !== item.correct) {
            incorrect = true;
          }
        } else if ($item.value.toLowerCase() !== item.correct.trim().toLowerCase()) {
          incorrect = true;
        }
      }
    }
    return incorrect;
  }

  _isInvalid(item) {
    let invalid = false;
    if (item.required === true && !item.hideForEventKinds) {
      const ref = this.inputs[item.field_name];
      if (item.element === 'Checkboxes' || item.element === 'RadioButtons') {
        let checked_options = 0;
        item.options.forEach(option => {
          const $option = ReactDOM.findDOMNode(ref.options[`child_ref_${option.key}`]);
          if ($option.checked) {
            checked_options += 1;
          }
        });
        if (checked_options < 1) {
          // errors.push(item.label + ' is required!');
          invalid = true;
        }
      } else if (item.element === 'GDPR') {
        const inputRef = document.getElementById('contact-form-GDPR');
        invalid = !inputRef.checked;
      } else if (item.element === 'AGB') {
        const inputRef = document.getElementById('contact-form-AGB');
        invalid = !inputRef.checked;
      } else if (item.element === 'Newsletter') {
        const inputRef = document.getElementById('contact-form-newsletter');
        invalid = !inputRef.checked;
      } else {
        const $item = this._getItemValue(item, ref);
        if (item.element === 'Rating') {
          if ($item.value === 0) {
            invalid = true;
          }
        } else if ($item.value === undefined || $item.value === null || $item.value.length < 1) {
          invalid = true;
        }
      }
    }
    return invalid;
  }

  _collect(item) {
    const itemData = {
      id: item.id,
      name: item.field_name,
      custom_name: item.custom_name || item.field_name,
      fieldOfInterest: item.fieldOfInterest ? item.fieldOfInterest.value : undefined,
      valuesOfInterest: item.valuesOfInterest && item.valuesOfInterest.length > 0 ? item.valuesOfInterest.map(v => v.value) : undefined,
    };
    if (!itemData.name) return null;

    const ref = this.inputs[item.field_name];
    if (item.element === 'Checkboxes' || item.element === 'RadioButtons') {
      const checked_options = [];
      item.options.forEach(option => {
        const $option = ReactDOM.findDOMNode(ref.options[`child_ref_${option.key}`]);
        if ($option.checked) {
          checked_options.push(this.props.useOptionNameInsteadOfKey ? option.text : option.key);
        }
      });
      itemData.value = checked_options;
    } else if (item.element === 'Newsletter') {
      const inputRef = document.getElementById('contact-form-newsletter');
      if (inputRef) {
        itemData.value = inputRef.checked;
      }
    } else {
      if (!ref) return null;
      if (item.isHiddenField) {
        itemData.value = item.fixedValue;
      } else {
        itemData.value = this._getItemValue(item, ref).value;
      }
    }
    return itemData;
  }

  _collectFormData(data) {
    const formData = [];
    data.forEach(item => {
      const item_data = this._collect(item);
      if (item_data) {
        formData.push(item_data);
      }
    });
    return formData;
  }

  _getSignatureImg(item) {
    const ref = this.inputs[item.field_name];
    const $canvas_sig = ref.canvas.current;
    if ($canvas_sig) {
      const base64 = $canvas_sig.toDataURL().replace('data:image/png;base64,', '');
      const isEmpty = $canvas_sig.isEmpty();
      const $input_sig = ReactDOM.findDOMNode(ref.inputField.current);
      if (isEmpty) {
        $input_sig.value = '';
      } else {
        $input_sig.value = base64;
      }
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    let errors = {};
    if (!this.props.skip_validations) {
      errors = this.validateForm();

      // Publish only error validation messages, if any.
      this.setState({ ...this.state, errors });
      this.emitter.emit('formValidation', Object.values(errors));
    }

    // Only submit if there are no errors.
    if (Object.keys(errors).length > 0) {
      return;
    }
    this.setState({ ...this.state, attemptingSubmit: true });
    const { onSubmit } = this.props;
    if (onSubmit) {
      const data = this._collectFormData(this.props.data);
      await onSubmit(data)
        .then((response) => this.showBanner(response.ok))
        .catch(() => this.showBanner(false));
    } else {
      const $form = ReactDOM.findDOMNode(this.form);

      await $form.submit();
    }
    this.setState({ ...this.state, attemptingSubmit: false });
  }

  showBanner(successful) {
    if (this.props.showSubmitMessage) {
      this.setState({ ...this.state, submitOk: successful, showingBanner: true });
    }
  }

   handleBlur(event) {
    // Call submit function on blur
    if (this.props.onBlur) {
      const {onBlur} = this.props;
      const data = this._collectFormData(this.props.data);
      onBlur(data);
    }
  }

  handleChange(event) {
    // Trigger re-render to support conditional items rendering
    this.setState((prev) => ({ ...prev, trigger: Date.now }));

    if (this.props.onChange) {
      const {onChange} = this.props;
      const data = this._collectFormData(this.props.data);
      onChange(data);
    }
  }

  validateForm() {
    const errors = {};

    const filterOrphanItems = () => {
      const allItemIDs = this.props.data.map(i => i.id);
      return this.props.data.filter((i) => !(i.parentId && !allItemIDs.includes(i.parentId)));
    };
    let data_items = filterOrphanItems();
    const { intl } = this.props;

    if (this.props.display_short) {
      data_items = this.props.data.filter((i) => i.alternateForm === true);
    }

    data_items.forEach(item => {
      if (item.element === 'Signature') {
        this._getSignatureImg(item);
      }

      if (this._isInvalid(item)) {
        errors[item.field_name] = `${item.label} ${intl.formatMessage({ id: 'message.is-required' })}!`;
      }

      if (item.element === 'EmailInput') {
        const ref = this.inputs[item.field_name];
        const emailValue = this._getItemValue(item, ref).value;
        if (emailValue) {
            const validateEmail = (email) => email.match(
              // eslint-disable-next-line no-useless-escape
              /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
          const checkEmail = validateEmail(emailValue);
          if (!item.skipValidation && !checkEmail) {
            errors[item.field_name] = `${item.label}: ${intl.formatMessage({ id: 'message.invalid-email' })}`;
          }
        }
      }

      if (item.element === 'PhoneNumber') {
        const ref = this.inputs[item.field_name];
        const phoneValue = this._getItemValue(item, ref).value;
        if (phoneValue) {
          const validatePhone = (phone) => phone.match(
            // eslint-disable-next-line no-useless-escape
            /^[+]?(1\-|1\s|1|\d{3}\-|\d{3}\s|)?((\(\d{3}\))|\d{3})(\-|\s)?(\d{3})(\-|\s)?(\d{4})$/g
          );
          const checkPhone = validatePhone(phoneValue);
          if (!item.skipValidation && !checkPhone) {
            errors[item.field_name] = `${item.label}: ${intl.formatMessage({ id: 'message.invalid-phone-number' })}`;
          }
        }
      }

      if (this.props.validateForCorrectness && this._isIncorrect(item)) {
        errors[item.field_name] = `${item.label} ${intl.formatMessage({ id: 'message.was-answered-incorrectly' })}!`;
      }
    });
    return errors;
  }

  getDataById(id) {
    const { data } = this.props;
    return data.find(x => x.id === id);
  }

  getInputElement(item, validationMessage) {
    if (item.custom) {
      return this.getCustomElement(item);
    }
    const alwaysHidden = item.isHiddenField;
    const conditionalRenderingApplied = !alwaysHidden && item.fieldOfInterest && item.valuesOfInterest && item.valuesOfInterest.length > 0;
    const Input = FormElements[item.element];
    return (<Input
      handleChange={this.handleChange}
      ref={c => this.inputs[item.field_name] = c}
      mutable={true}
      key={`form_${item.id}`}
      data={item}
      read_only={this.props.read_only}
      defaultValue={this._getDefaultValue(item)}
      inlineValidation={this.props.inlineValidation}
      validationMessage={validationMessage}
      // eslint-disable-next-line no-nested-ternary
      style={{ display: conditionalRenderingApplied ? BookitupUtils.getDisplayProp(item, this._collectFormData(this.props.data)) : alwaysHidden ? 'none' : undefined }}
      />);
  }

  getContainerElement(item, Element) {
    const controls = item.childItems.map((x) => {
      if (x) {
        const childItem = this.getDataById(x);
        let validationMessage = this.state.errors[childItem.field_name];
        if (validationMessage && childItem.validationMessageOverride) {
          validationMessage = childItem.validationMessageOverride;
        }
        return this.getInputElement(childItem, validationMessage);
      }
      return <div>&nbsp;</div>;
    });
    const conditionalRenderingApplied = item.fieldOfInterest && item.valuesOfInterest && item.valuesOfInterest.length > 0;
    return (<Element mutable={true} key={`form_${item.id}`} data={item} controls={controls} style={{ display: conditionalRenderingApplied ? BookitupUtils.getDisplayProp(item, this._collectFormData(this.props.data)) : undefined }}/>);
  }

  getSimpleElement(item) {
    const Element = FormElements[item.element];
    return (<Element mutable={true} key={`form_${item.id}`} data={item} />);
  }

  getCustomElement(item) {
    const { intl } = this.props;

    if (!item.component || typeof item.component !== 'function') {
      item.component = Registry.get(item.key);
      if (!item.component) {
        console.error(`${item.element} ${intl.formatMessage({ id: 'message.was-not-registered' })}`);
      }
    }

    const inputProps = item.forwardRef && {
      handleChange: this.handleChange,
      defaultValue: this._getDefaultValue(item),
      ref: c => this.inputs[item.field_name] = c,
    };
    return (
      <CustomElement
        mutable={true}
        read_only={this.props.read_only}
        key={`form_${item.id}`}
        data={item}
        {...inputProps}
      />
    );
  }

  handleRenderSubmit = () => {
    const name = this.props.action_name || this.props.actionName;
    const actionName = name || 'Submit';
    const { submitButton = false } = this.props;

    return submitButton || <input type='submit' disabled={this.state.attemptingSubmit} className='btn btn-big' value={actionName} />;
  }

  handleRenderBack = () => {
    const name = this.props.back_name || this.props.backName;
    const backName = name || 'Cancel';
    const { backButton = false } = this.props;

    return backButton || <a href={this.props.back_action} className='btn btn-default btn-cancel btn-big'>{backName}</a>;
  }

  handleBannerToggled = (showingBanner) => {
    this.setState({ ...this.state, showingBanner });
  }

  render() {
    let data_items = this.props.data;

    if (this.props.display_short) {
      data_items = this.props.data.filter((i) => i.alternateForm === true);
    }

    data_items.forEach((item) => {
      if (item && item.readOnly && item.variableKey && this.props.variables[item.variableKey]) {
        this.answerData[item.field_name] = this.props.variables[item.variableKey];
      }
    });

    const items = data_items.filter(x => !x.parentId).map(item => {
      let validationMessage = this.state.errors[item.field_name];

      if (validationMessage && item.validationMessageOverride) {
        validationMessage = item.validationMessageOverride;
      }

      if (!item) return null;
      switch (item.element) {
        case 'TextInput':
        case 'EmailInput':
        case 'PhoneNumber':
        case 'NumberInput':
        case 'TextArea':
        case 'Dropdown':
        case 'DatePicker':
        case 'RadioButtons':
        case 'Rating':
        case 'Tags':
        case 'Range':
        case 'GDPR':
        case 'AGB':
        case 'Newsletter':
        case 'HCaptcha':
          return this.getInputElement(item, validationMessage);
        case 'CustomElement':
          return this.getCustomElement(item);
        case 'MultiColumnRow':
          return this.getContainerElement(item, MultiColumnRow);
        case 'ThreeColumnRow':
          return this.getContainerElement(item, ThreeColumnRow);
        case 'TwoColumnRow':
          return this.getContainerElement(item, TwoColumnRow);
        case 'FieldSet':
        return this.getContainerElement(item, FieldSet);
        case 'Signature':
          return <Signature ref={c => this.inputs[item.field_name] = c} read_only={this.props.read_only || item.readOnly} mutable={true} key={`form_${item.id}`} data={item} defaultValue={this._getDefaultValue(item)} />;
        case 'Checkboxes':
          return <Checkboxes ref={c => this.inputs[item.field_name] = c} read_only={this.props.read_only} handleChange={this.handleChange} mutable={true} key={`form_${item.id}`} data={item} defaultValue={this._optionsDefaultValue(item)} />;
        case 'Image':
          return <Image ref={c => this.inputs[item.field_name] = c} handleChange={this.handleChange} mutable={true} key={`form_${item.id}`} data={item} defaultValue={this._getDefaultValue(item)} />;
        case 'Download':
          return <Download download_path={this.props.download_path} mutable={true} key={`form_${item.id}`} data={item} />;
        case 'Camera':
          return <Camera ref={c => this.inputs[item.field_name] = c} read_only={this.props.read_only || item.readOnly} mutable={true} key={`form_${item.id}`} data={item} defaultValue={this._getDefaultValue(item)} />;
        case 'FileUpload':
          return (
              <FileUpload
                ref={(c) => (this.inputs[item.field_name] = c)}
                read_only={this.props.read_only || item.readOnly}
                mutable={true}
                key={`form_${item.id}`}
                data={item}
                defaultValue={this._getDefaultValue(item)}
              />
          );
        case 'Recaptcha':
          return (
          <Recaptcha
            key={`form_${item.id}`}
            ref={(c) => (this.inputs[item.field_name] = c)}
            read_only={this.props.read_only || item.readOnly}
            mutable={true}
            data={item}
            validationMessage={validationMessage}
            inlineValidation={this.props.inlineValidation}
            />
            );
        default:
          return this.getSimpleElement(item);
      }
    });

    const formTokenStyle = {
      display: 'none',
    };

    const bannerText = this.state.submitOk
      ? this.props.submitMessageText ?? this.props.intl.formatMessage({ id: 'message.submit-successful' })
      : this.props.intl.formatMessage({ id: 'error.sending-request-failed' });

    // FormBuilder datePicker formats
    if (usableLocales[this.props.locale] !== undefined) {
      registerLocale(this.props.locale, usableLocales[this.props.locale]);
      setDefaultLocale(this.props.locale);
    }

    const showingSubmitButton = !this.props.hide_actions;

    return (
      <div>
          {/* Hide top validation messaged display if inlineValidation */}
          {!this.props.inlineValidation && (<FormValidator emitter={this.emitter} />)}
          <div className='react-form-builder-form'>
          {!this.state.submitOk &&
              <form encType='multipart/form-data' ref={c => this.form = c} action={this.props.form_action} onBlur={this.handleBlur} onChange={this.handleChange} onSubmit={this.handleSubmit} method={this.props.form_method}>
                {this.props.authenticity_token &&
                  <div style={formTokenStyle}>
                    <input name='utf8' type='hidden' value='&#x2713;' />
                    <input name='authenticity_token' type='hidden' value={this.props.authenticity_token} />
                    <input name='task_id' type='hidden' value={this.props.task_id} />
                  </div>
                }
                {items}
                <div className='btn-toolbar'>
                  {
                  showingSubmitButton && this.handleRenderSubmit()
                  }
                  {!this.props.hide_actions && this.props.back_action &&
                    this.handleRenderBack()
                  }
                </div>
              </form>
            }
            <div style={{ padding: 10 }}>
              <Banner
                className={this.state.submitOk ? undefined : 'banner-error'}
                title={bannerText}
                showBanner={this.state.showingBanner}
                setShowBanner={this.handleBannerToggled}
              />
            </div>
          </div>
      </div>
    );
  }
}

export default injectIntl(ReactForm);
ReactForm.defaultProps = { validateForCorrectness: false };
