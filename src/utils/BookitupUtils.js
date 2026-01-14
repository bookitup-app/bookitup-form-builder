/* eslint-disable camelcase */
/* eslint-disable import/prefer-default-export */
/* eslint-disable quotes */

const SUPPORTED_HIDE_ELEMENTS = [
  "TextInput",
  "EmailInput",
  "PhoneNumber",
  "NumberInput",
  "TextArea",
  "Dropdown",
  "DatePicker",
  "RadioButtons",
  "TwoColumnRow",
  "ThreeColumnRow",
  "FourColumnRow",
  "FiveColumnRow",
];

const OBERVABLE_ELEMENTS = ["Dropdown", "TextInput"];

const isConditionalHiddingPossible = (el) => {
  const { field_name, element } = el;
  if (field_name && field_name.startsWith("customer.emailAddress")) {
    // Customer address is always required
    return false;
  }
  // if (field_name && field_name.startsWith("kind")) {
  //   // Dont show for event kind selection
  //   return false;
  // }
  return SUPPORTED_HIDE_ELEMENTS.includes(element);
};

const getDisplayProp = (item, data) => {
  let display = "none";
  if (item.fieldOfInterest && item.valuesOfInterest) {
    const fieldRef = data.find((i) => i.name === item.fieldOfInterest.value);
    if (fieldRef) {
      const { value } = fieldRef;
      if (item.valuesOfInterest.map((v) => v.value).includes(value)) {
        display = undefined;
      }
    }
  }
  return display;
};

const filterObservableElements = (elements, curr) =>
  elements.filter(
    (e) =>
      OBERVABLE_ELEMENTS.includes(e.element) && e.field_name !== curr.field_name
  );

const showRequiredCheckbox = (el) =>
  !["Recaptcha", "AGB", "GDPR"].includes(el.element);

export const BookitupUtils = {
  isConditionalHiddingPossible,
  getDisplayProp,
  filterObservableElements,
  showRequiredCheckbox,
};
