import { FieldDefinition, FieldType, FilterConfig } from '../config/resourceConfig.types';
import { Column } from '../config/resourcesConfig';
import { getDefaultRenderer } from './fieldRenderers';

/**
 * Generate table columns from fields array
 * Filters fields where inTable !== false and maps to Column type
 */
export function generateTableColumns<T = unknown>(
  fields: FieldDefinition[]
): Column<T>[] {
  return fields
    .filter(field => field.inTable !== false)
    .map(field => ({
      key: field.key,
      label: field.label,
      sortable: field.sortable ?? false,
      width: field.width,
      render: field.render 
        ? (row: T) => {
            const value = getNestedValue(row, field.key);
            return field.render!(value, row);
          }
        : (row: T) => {
            const value = getNestedValue(row, field.key);
            const renderer = getDefaultRenderer(field.type);
            return renderer(value, row, field);
          },
    }));
}

/**
 * Generate filter configuration from fields array
 * Filters fields where filterable === true
 */
export function generateFilterConfig(
  fields: FieldDefinition[]
): FilterConfig {
  const filterableFields = fields.filter(f => f.filterable === true);
  
  return {
    type: 'url-synced',
    fields: filterableFields.map(field => ({
      key: field.key,
      type: field.filterType || getDefaultFilterType(field.type),
      label: field.label,
      placeholder: field.placeholder,
      options: field.options?.map(opt => ({
        value: String(opt.value),
        label: opt.label,
      })),
    })),
  };
}

/**
 * Get default filter type based on field type
 */
export function getDefaultFilterType(
  fieldType: FieldType
): FilterConfig['fields'][0]['type'] {
  switch (fieldType) {
    case 'text':
    case 'email':
    case 'textarea':
      return 'search';
    case 'select':
      return 'select';
    case 'date':
      return 'dateRange';
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'search';
    default:
      return 'search';
  }
}

/**
 * Get nested value from object using dot notation (e.g., 'name.common')
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return current;
}

/**
 * Generate form fields array from fields definition
 * Filters fields where inForm !== false
 */
export function getFormFields(fields: FieldDefinition[]): FieldDefinition[] {
  return fields.filter(field => field.inForm !== false);
}

/**
 * Extract unique regions from countries data
 * Used for dynamic filter options generation
 */
export function extractUniqueRegions<T extends { region?: string }>(countries: T[]): Array<{value: string, label: string}> {
  const regions = new Set<string>();
  countries.forEach(country => {
    if (country.region) {
      regions.add(country.region);
    }
  });
  return [
    { value: '', label: 'All Regions' },
    ...Array.from(regions)
      .sort()
      .map(region => ({ value: region, label: region }))
  ];
}

/**
 * Extract unique currencies from countries data
 * Used for dynamic filter options generation
 */
export function extractUniqueCurrencies<T extends { currencies?: { [key: string]: { name: string; symbol: string } } }>(countries: T[]): Array<{value: string, label: string}> {
  const currencyMap = new Map<string, string>();
  countries.forEach(country => {
    if (country.currencies && typeof country.currencies === 'object') {
      Object.keys(country.currencies).forEach(code => {
        const currency = country.currencies![code];
        if (!currencyMap.has(code) && currency?.name) {
          currencyMap.set(code, currency.name);
        }
      });
    }
  });
  return [
    { value: '', label: 'All Currencies' },
    ...Array.from(currencyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, name]) => ({ 
        value: code, 
        label: `${code} - ${name}` 
      }))
  ];
}
