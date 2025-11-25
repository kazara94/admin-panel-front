import { FieldDefinition, FieldType } from '../config/resourceConfig.types';

export type EntryFieldType = {
  key: string;
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  inTable?: boolean;
  inForm?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  width?: string;
  isLabel?: boolean;
  isPlaceholder?: boolean;
  isMultiple?: boolean;
};

const mapLegacyFieldType = (value?: string): FieldType => {
  switch ((value || '').toLowerCase()) {
    case 'number':
      return 'number';
    case 'email':
      return 'email';
    case 'select':
      return 'select';
    case 'textarea':
      return 'textarea';
    case 'date':
      return 'date';
    case 'boolean':
      return 'boolean';
    case 'yesno':
      return 'yesNo';
    case 'editor':
      return 'editor';
    case 'upload':
      return 'upload';
    default:
      return 'text';
  }
};

export const adaptEntryField = (field: EntryFieldType): FieldDefinition => {
  return {
    key: field.key,
    label: field.label || field.key,
    type: mapLegacyFieldType(field.type),
    placeholder: field.placeholder,
    required: field.required,
    options: field.options,
    inForm: field.inForm,
    inTable: field.inTable,
    filterable: field.filterable,
    sortable: field.sortable,
    width: field.width,
    isLabel: field.isLabel,
    isPlaceholder: field.isPlaceholder,
    isMultiple: field.isMultiple,
  };
};

export const adaptEntryFields = (fields: EntryFieldType[]): FieldDefinition[] => {
  return fields.map(adaptEntryField);
};

