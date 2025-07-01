import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, FileText, Square, Palette, FolderOpen } from "lucide-react";
import { useLocation } from "wouter";
import { type OutputType } from "@/lib/types";
import { useState, useRef } from "react";
import { readFileAsText } from "@/lib/csvParser";

const outputTypes = [
  {
    type: 'text' as OutputType,
    title: 'Text Output',
    description: 'Compare and edit text outputs from different models with side-by-side editing capabilities.',
    icon: FileText,
    features: ['Editable text fields', 'Preference selection', 'Version comparison'],
    color: 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
  },
  {
    type: 'bounding-box' as OutputType,
    title: 'Bounding Box',
    description: 'Visual comparison of bounding box predictions with overlay visualization and accuracy metrics.',
    icon: Square,
    features: ['Visual overlays', 'Coordinate display', 'Accuracy metrics'],
    color: 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white'
  },
  {
    type: 'svg' as OutputType,
    title: 'SVG Output',
    description: 'Compare vector graphics outputs with interactive preview and code inspection tools.',
    icon: Palette,
    features: ['Interactive preview', 'Code inspection', 'Quality comparison'],
    color: 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'
  }
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [modelACSV, setModelACSV] = useState<File | null>(null);
  const [modelBCSV, setModelBCSV] = useState<File | null>(null);
  const [selectedOutputType, setSelectedOutputType] = useState<OutputType | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const modelACSVRef = useRef<HTMLInputElement>(null);
  const modelBCSVRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = () => {
    folderInputRef.current?.click();
  };

  const handleFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Get the folder path from the first file
      const firstFile = files[0];
      const folderPath = firstFile.webkitRelativePath.split('/')[0];
      setSelectedFolder(folderPath);
      
      // Store the files in sessionStorage for later use
      const fileArray = Array.from(files).map(file => ({
        name: file.name,
        path: file.webkitRelativePath,
        url: URL.createObjectURL(file)
      }));
      sessionStorage.setItem('selectedImages', JSON.stringify(fileArray));
    }
  };

  const handleCSVSelect = (model: 'A' | 'B') => {
    if (model === 'A') {
      modelACSVRef.current?.click();
    } else {
      modelBCSVRef.current?.click();
    }
  };

  const handleCSVChange = (event: React.ChangeEvent<HTMLInputElement>, model: 'A' | 'B') => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      if (model === 'A') {
        setModelACSV(file);
      } else {
        setModelBCSV(file);
      }
    } else if (file) {
      alert('Please select a valid CSV file.');
    }
  };

  const handleOutputTypeSelect = (outputType: OutputType) => {
    setSelectedOutputType(outputType);
  };

  const handleStartCuration = async () => {
    if (!selectedFolder) {
      alert('Please select a folder containing images first.');
      return;
    }
    if (!selectedOutputType) {
      alert('Please select an output type first.');
      return;
    }
    if (!modelACSV) {
      alert('Please upload Model A CSV file.');
      return;
    }
    if (!modelBCSV) {
      alert('Please upload Model B CSV file.');
      return;
    }

    try {
      // Read CSV file contents
      const modelAContent = await readFileAsText(modelACSV);
      const modelBContent = await readFileAsText(modelBCSV);

      // Store CSV content in sessionStorage
      sessionStorage.setItem('modelACSV', JSON.stringify({
        name: modelACSV.name,
        content: modelAContent
      }));
      sessionStorage.setItem('modelBCSV', JSON.stringify({
        name: modelBCSV.name,
        content: modelBContent
      }));

      setLocation(`/gallery?type=${selectedOutputType}&folder=${encodeURIComponent(selectedFolder)}`);
    } catch (error) {
      alert('Error reading CSV files. Please try again.');
      console.error('CSV reading error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Database className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Data Curation Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100">
                <div className="w-5 h-5 border border-gray-400 rounded"></div>
              </button>
              <button className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100">
                <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Landing Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Setup Data Curation</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            First, select a folder containing images, then choose the type of data output you want to curate.
          </p>
          
          {/* Folder Selection */}
          <div className="mb-8">
            <Button 
              onClick={handleFolderSelect}
              className="mb-4"
              size="lg"
            >
              <FolderOpen className="w-5 h-5 mr-2" />
              Select Image Folder
            </Button>
            {selectedFolder && (
              <p className="text-green-600 font-medium">
                Selected folder: {selectedFolder}
              </p>
            )}
            <input
              ref={folderInputRef}
              type="file"
              {...({ webkitdirectory: "" } as any)}
              multiple
              onChange={handleFolderChange}
              className="hidden"
              accept="image/*"
            />
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {outputTypes.map((outputType) => {
            const IconComponent = outputType.icon;
            return (
              <Card 
                key={outputType.type}
                className={`cursor-pointer hover:shadow-xl transition-all duration-200 border-2 group ${
                  selectedOutputType === outputType.type 
                    ? 'border-primary shadow-lg' 
                    : 'border-transparent hover:border-primary'
                }`}
                onClick={() => handleOutputTypeSelect(outputType.type)}
              >
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors ${outputType.color}`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{outputType.title}</h3>
                    <p className="text-gray-600 mb-6">{outputType.description}</p>
                    <ul className="text-sm text-gray-500 space-y-2 text-left">
                      {outputType.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* CSV Upload Section */}
        {selectedOutputType && (
          <div className="mt-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Upload Model Output Files</h3>
              <p className="text-gray-600 mb-6">
                Upload CSV files containing {selectedOutputType === 'text' ? 'OCR text outputs' : 
                selectedOutputType === 'bounding-box' ? 'bounding box coordinates' : 
                'SVG file paths'} for each model.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Model A CSV */}
              <Card className="p-6">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Model A CSV</h4>
                  <Button 
                    onClick={() => handleCSVSelect('A')}
                    variant={modelACSV ? "secondary" : "default"}
                    className="mb-4"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {modelACSV ? 'Change File' : 'Select CSV File'}
                  </Button>
                  {modelACSV && (
                    <p className="text-green-600 text-sm font-medium">
                      ✓ {modelACSV.name}
                    </p>
                  )}
                </div>
              </Card>
              
              {/* Model B CSV */}
              <Card className="p-6">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Model B CSV</h4>
                  <Button 
                    onClick={() => handleCSVSelect('B')}
                    variant={modelBCSV ? "secondary" : "default"}
                    className="mb-4"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {modelBCSV ? 'Change File' : 'Select CSV File'}
                  </Button>
                  {modelBCSV && (
                    <p className="text-green-600 text-sm font-medium">
                      ✓ {modelBCSV.name}
                    </p>
                  )}
                </div>
              </Card>
            </div>
            
            {/* Start Curation Button */}
            <div className="text-center">
              <Button 
                onClick={handleStartCuration}
                size="lg"
                className="px-8 py-4 text-lg font-medium"
                disabled={!selectedFolder || !selectedOutputType || !modelACSV || !modelBCSV}
              >
                Start Curation Process
              </Button>
            </div>
            
            {/* Hidden CSV input fields */}
            <input
              ref={modelACSVRef}
              type="file"
              accept=".csv"
              onChange={(e) => handleCSVChange(e, 'A')}
              className="hidden"
            />
            <input
              ref={modelBCSVRef}
              type="file"
              accept=".csv"
              onChange={(e) => handleCSVChange(e, 'B')}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}
