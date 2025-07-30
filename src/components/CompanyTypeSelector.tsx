import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const COMPANY_TYPES = [
  {
    id: 'service',
    title: 'Service',
    description: 'Businesses providing services to clients.'
  },
  {
    id: 'saas',
    title: 'SaaS',
    description: 'Software-as-a-Service or subscription-based businesses.'
  },
  {
    id: 'retail',
    title: 'Retail',
    description: 'Businesses selling physical products.'
  },
  {
    id: 'carbon',
    title: 'Carbon Credit Project',
    description: 'Projects focused on carbon credits and environmental impact.'
  }
];

interface CompanyTypeSelectorProps {
  selectedType: string | null;
  onSelect: (type: string) => void;
}

export const CompanyTypeSelector: React.FC<CompanyTypeSelectorProps> = ({ selectedType, onSelect }) => {
  return (
    <div className="flex gap-6 justify-center my-8">
      {COMPANY_TYPES.map((type) => (
        <Card
          key={type.id}
          className={cn(
            'w-64 cursor-pointer border-2 transition-all duration-150',
            selectedType === type.id ? 'border-blue-600 shadow-lg bg-blue-50' : 'border-border hover:border-blue-300 hover:bg-blue-50/50'
          )}
          onClick={() => onSelect(type.id)}
        >
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="text-lg font-semibold mb-2">{type.title}</div>
            <div className="text-sm text-muted-foreground mb-1">{type.description}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CompanyTypeSelector; 