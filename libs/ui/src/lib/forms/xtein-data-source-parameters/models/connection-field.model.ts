/**
 * Represents an available value for a connection field.
 */
export interface ConnectionFieldOption {
  value: string;
}

/**
 * Represents the configuration of a connection parameter
 * returned by the XTEIN backend.
 *
 * Property names are intentionally preserved from the
 * existing backend contract.
 */
export interface ConnectionField {
  source: string;
  sourcetype: string;
  name: string;
  label: string;
  type: string;
  required?: boolean;
  items?: ConnectionFieldOption[];
  placeholder?: string;
  defaultValue?: any;
}