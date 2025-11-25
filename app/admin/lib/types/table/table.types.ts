export interface TableAction {
  name: string;
  label: string;
  icon: string;
  link?: string;
}

export interface TableRowAction {
  name: string;
  label: string;
  icon: string;
  custom?: Record<string, unknown>;
}

