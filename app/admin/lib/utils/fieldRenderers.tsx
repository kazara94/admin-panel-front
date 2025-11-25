import React from 'react';
import { FieldType, FieldDefinition } from '../config/resourceConfig.types';

/**
 * Default renderer for text fields
 */
export function renderText(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">N/A</span>;
  }
  return <span className="text-gray-900">{String(value)}</span>;
}

/**
 * Default renderer for email fields
 */
export function renderEmail(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">N/A</span>;
  }
  return (
    <a 
      href={`mailto:${String(value)}`}
      className="text-primary hover:underline"
    >
      {String(value)}
    </a>
  );
}

/**
 * Default renderer for number fields
 */
export function renderNumber(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">N/A</span>;
  }
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(numValue)) {
    return <span className="text-gray-400 italic">Invalid</span>;
  }
  return <span className="text-gray-900 font-medium">{numValue.toLocaleString()}</span>;
}

/**
 * Default renderer for select fields
 */
export function renderSelect(value: unknown, field: FieldDefinition): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">N/A</span>;
  }
  
  const valueStr = String(value);
  const option = field.options?.find(opt => String(opt.value) === valueStr);
  
  if (option) {
    return <span className="text-gray-900">{option.label}</span>;
  }
  
  return <span className="text-gray-900">{valueStr}</span>;
}

/**
 * Default renderer for date fields
 */
export function renderDate(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">N/A</span>;
  }
  
  try {
    const date = new Date(String(value));
    if (isNaN(date.getTime())) {
      return <span className="text-gray-400 italic">Invalid date</span>;
    }
    
    return (
      <div className="text-sm">
        <div className="text-gray-900 font-medium">
          {date.toLocaleDateString()}
        </div>
        <div className="text-gray-500 text-xs">
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    );
  } catch {
    return <span className="text-gray-400 italic">Invalid date</span>;
  }
}

/**
 * Default renderer for boolean fields
 */
export function renderBoolean(value: unknown): React.ReactNode {
  const boolValue = Boolean(value);
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
      boolValue 
        ? 'bg-green-100 text-green-700' 
        : 'bg-gray-100 text-gray-700'
    }`}>
      {boolValue ? 'Yes' : 'No'}
    </span>
  );
}

/**
 * Get default renderer function for a field type
 */
export function getDefaultRenderer(fieldType: FieldType): (value: unknown, row: unknown, field?: FieldDefinition) => React.ReactNode {
  switch (fieldType) {
    case 'text':
      return (value: unknown) => renderText(value);
    case 'email':
      return (value: unknown) => renderEmail(value);
    case 'number':
      return (value: unknown) => renderNumber(value);
    case 'select':
      return (value: unknown, _row: unknown, field?: FieldDefinition) => {
        if (!field) {
          return renderText(value);
        }
        return renderSelect(value, field);
      };
    case 'date':
      return (value: unknown) => renderDate(value);
    case 'boolean':
      return (value: unknown) => renderBoolean(value);
    case 'yesNo':
      return (value: unknown) => renderBoolean(value);
    case 'textarea':
      return (value: unknown) => renderText(value);
    case 'editor':
      return (value: unknown) => renderText(value);
    case 'upload':
      return (value: unknown) => renderText(value);
    default:
      return (value: unknown) => renderText(value);
  }
}
