
export interface Variable {
  id: string;
  name: string;
  description: string;
  value: number;
  unit: string;
}

export interface VariableSection {
  id: string;
  name: string;
  description: string;
  variables: Variable[];
}

export interface Model {
  id: string;
  name: string;
  description: string;
  type: 'startup' | 'three-statement';
  createdAt: Date;
  updatedAt: Date;
  variableSections?: VariableSection[];
}
