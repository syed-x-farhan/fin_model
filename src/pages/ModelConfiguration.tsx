import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Copy, Trash2, Upload, Download } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from '@/contexts/AuthContext';
import { Model } from '@/types';
import { ImportWizard, RowData, ColumnMapping } from '@/components/excel';

interface Variable {
  id: string;
  name: string;
  description: string;
  value: number;
  unit: string;
}

interface VariableSection {
  id: string;
  name: string;
  description: string;
  variables: Variable[];
}

const ModelConfiguration: React.FC = () => {
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const { authToken } = useAuth();

  const [model, setModel] = useState<Model | null>(null);
  const [variableSections, setVariableSections] = useState<VariableSection[]>([]);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  useEffect(() => {
    if (!modelId || !authToken) return;

    const fetchModel = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/models/${modelId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const modelData: Model = await response.json();
        setModel(modelData);
        setVariableSections(modelData.variableSections || []);
      } catch (error) {
        console.error("Failed to fetch model:", error);
        toast({
          title: "Error fetching model",
          description: "Failed to retrieve model details. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchModel();
  }, [modelId, authToken]);

  const handleVariableChange = (sectionId: string, variableId: string, newValue: number) => {
    const updatedSections = variableSections.map(section => {
      if (section.id === sectionId) {
        const updatedVariables = section.variables.map(variable => {
          if (variable.id === variableId) {
            return { ...variable, value: newValue };
          }
          return variable;
        });
        return { ...section, variables: updatedVariables };
      }
      return section;
    });
    setVariableSections(updatedSections);
  };

  const handleSectionNameChange = (sectionId: string, newName: string) => {
    const updatedSections = variableSections.map(section => {
      if (section.id === sectionId) {
        return { ...section, name: newName };
      }
      return section;
    });
    setVariableSections(updatedSections);
  };

  const handleVariableNameChange = (sectionId: string, variableId: string, newName: string) => {
    const updatedSections = variableSections.map(section => {
      if (section.id === sectionId) {
        const updatedVariables = section.variables.map(variable => {
          if (variable.id === variableId) {
            return { ...variable, name: newName };
          }
          return variable;
        });
        return { ...section, variables: updatedVariables };
      }
      return section;
    });
    setVariableSections(updatedSections);
  };

  const handleAddVariable = (sectionId: string) => {
    const newVariable: Variable = {
      id: `variable_${Date.now()}`,
      name: 'New Variable',
      description: '',
      value: 0,
      unit: '',
    };

    const updatedSections = variableSections.map(section => {
      if (section.id === sectionId) {
        return { ...section, variables: [...section.variables, newVariable] };
      }
      return section;
    });

    setVariableSections(updatedSections);
  };

  const handleAddSection = () => {
    const newSection: VariableSection = {
      id: `section_${Date.now()}`,
      name: 'New Section',
      description: '',
      variables: [],
    };

    setVariableSections([...variableSections, newSection]);
  };

  const handleDuplicateSection = (sectionId: string) => {
    const sectionToDuplicate = variableSections.find(section => section.id === sectionId);

    if (sectionToDuplicate) {
      const duplicatedSection: VariableSection = {
        ...sectionToDuplicate,
        id: `section_${Date.now()}`,
        name: `${sectionToDuplicate.name} Copy`,
      };

      setVariableSections([...variableSections, duplicatedSection]);
    }
  };

  const handleDeleteSection = (sectionId: string) => {
    setVariableSections(variableSections.filter(section => section.id !== sectionId));
  };

  const handleDeleteVariable = (sectionId: string, variableId: string) => {
    const updatedSections = variableSections.map(section => {
      if (section.id === sectionId) {
        const updatedVariables = section.variables.filter(variable => variable.id !== variableId);
        return { ...section, variables: updatedVariables };
      }
      return section;
    });
    setVariableSections(updatedSections);
  };

  const handleSave = async () => {
    if (!modelId || !authToken || !model) return;

    try {
      const updatedModel = { ...model, variableSections };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/models/${modelId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedModel),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const savedModel: Model = await response.json();
      setModel(savedModel);
      setVariableSections(savedModel.variableSections || []);

      toast({
        title: "Model saved",
        description: "Your model configuration has been successfully saved.",
      });
    } catch (error) {
      console.error("Failed to save model:", error);
      toast({
        title: "Error saving model",
        description: "Failed to save model configuration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    setSelectedModel(model);
    setIsImportWizardOpen(true);
  };

  const handleCancelImport = () => {
    setIsImportWizardOpen(false);
  };

  const handleImportComplete = (data: RowData[], mappings: ColumnMapping[]) => {
    if (!selectedModel) return;
    
    // Update variable sections with imported data
    const updatedSections = [...variableSections];
    
    data.forEach(row => {
      // Find mappings that correspond to variable names and values
      mappings.forEach(mapping => {
        if (mapping.mappedTo && row[mapping.excelColumn]) {
          const mappedCategory = mapping.mappedTo;
          const value = parseFloat(String(row[mapping.excelColumn].value)) || 0;
          
          // Find matching variable by mapped category across all sections
          updatedSections.forEach(section => {
            const matchingVariable = section.variables.find(variable => 
              variable.name.toLowerCase().includes(mappedCategory.toLowerCase()) || 
              mappedCategory.toLowerCase().includes(variable.name.toLowerCase().replace(/\s+/g, '_'))
            );
            
            if (matchingVariable) {
              matchingVariable.value = value;
            }
          });
        }
      });
    });
    
    setVariableSections(updatedSections);
    
    // Show success message
    toast({
      title: "Data imported successfully",
      description: `Imported ${data.length} rows from Excel file`,
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{model?.name || 'Loading...'}</h1>
          <p className="text-muted-foreground">Configure the variables for this model.</p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate(`/models`)}>
            Back to Models
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Import/Export Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Import / Export</h2>
        <div className="space-x-2">
          <Button onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import from Excel
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Variable Sections */}
      <div className="space-y-8">
        {variableSections.map((section) => (
          <Card key={section.id}>
            <CardHeader className="flex items-center justify-between">
              <div>
                <Input
                  type="text"
                  value={section.name}
                  onChange={(e) => handleSectionNameChange(section.id, e.target.value)}
                  placeholder="Section Name"
                  className="text-lg font-semibold mb-1 max-w-xs"
                />
                <CardDescription>{section.description}</CardDescription>
              </div>
              <div className="space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleAddVariable(section.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDuplicateSection(section.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-500">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the section
                        and all of its variables.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteSection(section.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.variables.map((variable) => (
                    <TableRow key={variable.id}>
                      <TableCell>
                        <Input
                          type="text"
                          value={variable.name}
                          onChange={(e) => handleVariableNameChange(section.id, variable.id, e.target.value)}
                          placeholder="Variable Name"
                        />
                      </TableCell>
                      <TableCell>
                        <Input type="text" placeholder="Description" />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={variable.value}
                          onChange={(e) => handleVariableChange(section.id, variable.id, parseFloat(e.target.value))}
                          placeholder="Value"
                        />
                      </TableCell>
                      <TableCell>
                        <Input type="text" placeholder="Unit" />
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the variable.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteVariable(section.id, variable.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={handleAddSection}>
        <Plus className="h-4 w-4 mr-2" />
        Add Section
      </Button>

      {/* Import Wizard Modal */}
      {isImportWizardOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50">
          <div className="relative m-auto mt-20 max-w-4xl">
            <ImportWizard
              onImportComplete={handleImportComplete}
              onCancel={handleCancelImport}
              modelId="3-statement"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelConfiguration;
