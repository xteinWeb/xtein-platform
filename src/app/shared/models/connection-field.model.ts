export interface ConnectionFieldOption{
    value:string;
}

export interface ConnectionField {
  source: string; 
  sourcetype: string; //'File' | 'DataBase'
  name: string; 
  label: string;
  type: string; //'text' | 'password' | 'number' | 'select'
  required?: boolean;
  items?:ConnectionFieldOption[];
  placeholder?: string;
  defaultValue?: any;
}

