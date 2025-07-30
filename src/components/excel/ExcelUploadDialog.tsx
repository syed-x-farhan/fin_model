import React, { useState } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { importExcelData } from '@/services/api';

interface ExcelUploadDialogProps {
  modelId: string;
  onFileSelect: (file: File) => void;
  onUploadComplete: (data: any) => void;
  loading?: boolean;
  trigger?: React.ReactNode;
}

interface UploadStatus {
  status: 'idle' | 'uploading' | 'parsing' | 'success' | 'error';
  progress: number;
  message: string;
}

export const ExcelUploadDialog: React.FC<ExcelUploadDialogProps> = ({
  modelId,
  onFileSelect,
  onUploadComplete,
  loading = false,
  trigger
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [dragActive, setDragActive] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: 'Please select a valid Excel file (.xlsx, .xls) or CSV file.'
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: 'File size must be less than 10MB.'
      });
      return;
    }

    setSelectedFile(file);
    setUploadStatus({
      status: 'idle',
      progress: 0,
      message: 'File ready for upload'
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus({
        status: 'uploading',
        progress: 30,
        message: 'Uploading file...'
      });

      // Call parent handler
      onFileSelect(selectedFile);
      
      setUploadStatus({
        status: 'parsing',
        progress: 70,
        message: 'Parsing Excel data...'
      });

      // Import Excel file using real API (all sheets)
      const importResult = await importExcelData(modelId, selectedFile);
      console.log('importResult:', importResult);

      if (!importResult.success) {
        throw new Error(importResult.error || 'Failed to import Excel file');
      }

      // The backend returns all_sheet_data and sheets
      setUploadStatus({
        status: 'success',
        progress: 100,
        message: 'File processed successfully!'
      });

      // Pass all sheet data to parent
      // Try to extract all_sheet_data from the most likely places
      // Type assertion to any to allow dynamic property access
      const dataAny = importResult.data as any;
      // Handle double-wrapped response structure
      const allSheetData = dataAny?.data?.all_sheet_data || dataAny?.all_sheet_data || dataAny?.parsed_data || dataAny || {};
      onUploadComplete(allSheetData);

      // Auto-close dialog after success
      setTimeout(() => {
        setOpen(false);
        resetDialog();
      }, 1500);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Error processing file. Please try again.'
      });
    }
  };

  const resetDialog = () => {
    setSelectedFile(null);
    setUploadStatus({
      status: 'idle',
      progress: 0,
      message: ''
    });
    setDragActive(false);
  };

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus.status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'uploading':
      case 'parsing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import from Excel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Financial Data</DialogTitle>
          <DialogDescription>
            Upload your Excel file containing financial statements and assumptions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            
            <div className="flex flex-col items-center gap-3">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Drop your Excel file here, or{' '}
                  <label htmlFor="file-upload" className="text-primary cursor-pointer hover:underline">
                    browse
                  </label>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .xlsx, .xls, and .csv files up to 10MB
                </p>
              </div>
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className={getStatusColor()}>
                {uploadStatus.status === 'idle' ? 'Ready' : uploadStatus.status}
              </Badge>
            </div>
          )}

          {/* Upload Progress */}
          {(uploadStatus.status === 'uploading' || uploadStatus.status === 'parsing') && (
            <div className="space-y-2">
              <Progress value={uploadStatus.progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {uploadStatus.message}
              </p>
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus.message && uploadStatus.status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadStatus.message}</AlertDescription>
            </Alert>
          )}

          {uploadStatus.status === 'success' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{uploadStatus.message}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || uploadStatus.status === 'uploading' || uploadStatus.status === 'parsing'}
              className="flex-1"
            >
              {uploadStatus.status === 'uploading' || uploadStatus.status === 'parsing' 
                ? 'Processing...' 
                : 'Upload & Parse'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};