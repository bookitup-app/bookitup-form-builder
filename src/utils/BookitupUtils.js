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
  "GDPR",
];

const isConditionalHiddingPossible = (el) => {
  // Disable for now
  return false;
  // const { field_name, element } = el;
  // if (field_name && field_name.startsWith('customer.emailAddress')) {
  //   // Always reqired field
  //   return false;
  // }
  // if (field_name && field_name.startsWith("kind")) {
  //   // Dont show for event kind selection
  //   return false;
  // }

  // return SUPPORTED_HIDE_ELEMENTS.includes(element);
};

const getDisplayProp = (item, resolveData) => {
  let display;
  if (item.hideForEventKinds) {
    const currentKindValue = resolveData().find((i) => i.name.startsWith("kind"));
    if (
      currentKindValue &&
      item.hideForEventKinds.includes(currentKindValue.value)
    ) {
      display = "none";
    }
  }
  return display;
};

export const BookitupUtils = {
  isConditionalHiddingPossible,
  getDisplayProp,
};
