import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Database, Bot } from "lucide-react";
import InputPanel from "@/components/input-panel";
import OutputPanel from "@/components/output-panel";
import { apiRequest } from "@/lib/queryClient";
import { parseCSV, readFileAsText, extractModelOutput, type ParsedCSVData } from "@/lib/csvParser";
import { type CurationItem, type UserPreference, type TextOutput } from "@shared/schema";
import { type OutputType } from "@/lib/types";

export default function Curation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get output type and folder from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const outputType = urlParams.get('type') as OutputType;
  const selectedFolder = urlParams.get('folder');
  
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [csvData, setCSVData] = useState<{
    modelA: ParsedCSVData | null;
    modelB: ParsedCSVData | null;
  }>({ modelA: null, modelB: null });
  const [csvLoading, setCSVLoading] = useState(true);
  const [editedOutputs, setEditedOutputs] = useState<{
    modelA: string[];
    modelB: string[];
  }>({ modelA: [], modelB: [] });

  // Load images count and CSV data from sessionStorage
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        setCSVLoading(true);
        
        // Load images count
        const storedImages = sessionStorage.getItem('selectedImages');
        if (storedImages) {
          const imageArray = JSON.parse(storedImages);
          setTotalImages(imageArray.length);
        }

        // Load CSV files from sessionStorage
        const modelAInfo = sessionStorage.getItem('modelACSV');
        const modelBInfo = sessionStorage.getItem('modelBCSV');
        
        if (modelAInfo && modelBInfo) {
          const modelA = JSON.parse(modelAInfo);
          const modelB = JSON.parse(modelBInfo);
          
          if (modelA.content && modelB.content) {
            // Parse CSV content
            const modelAData = parseCSV(modelA.content);
            const modelBData = parseCSV(modelB.content);
            
            console.log('Model A CSV data:', modelAData);
            console.log('Model B CSV data:', modelBData);
            
            setCSVData({
              modelA: modelAData,
              modelB: modelBData
            });
            
            console.log('CSV data loaded successfully');
          }
        }
      } catch (error) {
        console.error('Error loading CSV data:', error);
        toast({
          title: "Error loading CSV data",
          description: "Failed to load CSV files. Please try uploading again.",
          variant: "destructive"
        });
      } finally {
        setCSVLoading(false);
      }
    };

    loadCSVData();
  }, [toast]);

  // Fetch curation items
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/curation-items'],
    select: (data: { items: CurationItem[], total: number }) => data
  });

  // Create dynamic items from CSV data or use existing filtered items
  const dynamicItems = React.useMemo(() => {
    if (csvData.modelA && csvData.modelB && outputType) {
      try {
        // Get unique filenames to determine number of items
        const filenames = csvData.modelA.rows.map(row => row['filename']).filter(f => f && f.trim() !== '');
        const uniqueFilenames: string[] = [];
        
        // Manual unique array creation to avoid Set iteration issues
        for (const filename of filenames) {
          if (uniqueFilenames.indexOf(filename) === -1) {
            uniqueFilenames.push(filename);
          }
        }
        
        console.log('Unique filenames found:', uniqueFilenames);
        
        const items: CurationItem[] = [];
        
        for (let i = 0; i < uniqueFilenames.length; i++) {
          const modelAOutput = extractModelOutput(csvData.modelA, outputType, i);
          const modelBOutput = extractModelOutput(csvData.modelB, outputType, i);
          
          console.log(`Item ${i + 1} - Model A output:`, modelAOutput);
          console.log(`Item ${i + 1} - Model B output:`, modelBOutput);
          
          items.push({
            id: i + 1,
            inputData: `Image ${i + 1}`,
            outputType: outputType,
            modelAOutput: modelAOutput || [],
            modelBOutput: modelBOutput || []
          });
        }
        
        console.log('Created dynamic items:', items);
        return items;
      } catch (error) {
        console.error('Error creating dynamic items:', error);
        // Fallback to existing filtered items on error
        return itemsData?.items?.filter(item => item.outputType === outputType) || [];
      }
    }
    
    // Fallback to existing filtered items
    return itemsData?.items?.filter(item => item.outputType === outputType) || [];
  }, [csvData, outputType, itemsData]);

  const totalFilteredItems = dynamicItems.length;
  const currentItem = dynamicItems[currentItemIndex];

  // Fetch user preference for current item
  const { data: preference } = useQuery({
    queryKey: ['/api/preferences', currentItem?.id],
    enabled: !!currentItem?.id
  }) as { data: UserPreference | null };

  // Save preference mutation
  const savePreferenceMutation = useMutation({
    mutationFn: async (data: { itemId: number; preferredModel?: string; modelAEdited?: string[]; modelBEdited?: string[] }) => {
      return apiRequest('POST', '/api/preferences', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
      toast({
        title: "Preference saved",
        description: "Your selection has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preference. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Initialize edited outputs when item changes
  useEffect(() => {
    if (currentItem && currentItem.outputType === 'text') {
      let modelATexts: string[] = [];
      let modelBTexts: string[] = [];
      
      // Check if outputs are already arrays (from CSV) or TextOutput objects
      if (Array.isArray(currentItem.modelAOutput)) {
        modelATexts = currentItem.modelAOutput as string[];
      } else {
        const textOutputA = currentItem.modelAOutput as TextOutput;
        modelATexts = textOutputA.outputs?.map((output: any) => output.text) || [];
      }
      
      if (Array.isArray(currentItem.modelBOutput)) {
        modelBTexts = currentItem.modelBOutput as string[];
      } else {
        const textOutputB = currentItem.modelBOutput as TextOutput;
        modelBTexts = textOutputB.outputs?.map((output: any) => output.text) || [];
      }
      
      // Use preference edited texts if available, otherwise use original texts
      const finalModelATexts = (Array.isArray(preference?.modelAEdited) ? preference.modelAEdited : null) || modelATexts;
      const finalModelBTexts = (Array.isArray(preference?.modelBEdited) ? preference.modelBEdited : null) || modelBTexts;
      
      setEditedOutputs({
        modelA: finalModelATexts,
        modelB: finalModelBTexts
      });
    }
  }, [currentItem, preference]);

  const handlePreferenceChange = (model: 'a' | 'b', checked: boolean) => {
    if (!currentItem) return;
    
    const preferredModel = checked ? model : undefined;
    
    savePreferenceMutation.mutate({
      itemId: currentItem.id,
      preferredModel,
      modelAEdited: editedOutputs.modelA,
      modelBEdited: editedOutputs.modelB
    });
  };

  const handleTextEdit = (model: 'a' | 'b', index: number, text: string) => {
    setEditedOutputs(prev => {
      const key = model === 'a' ? 'modelA' : 'modelB';
      const newTexts = [...prev[key]];
      newTexts[index] = text;
      return {
        ...prev,
        [key]: newTexts
      };
    });
  };

  const handleSaveProgress = () => {
    if (!currentItem) return;
    
    savePreferenceMutation.mutate({
      itemId: currentItem.id,
      preferredModel: preference?.preferredModel ?? undefined,
      modelAEdited: editedOutputs.modelA,
      modelBEdited: editedOutputs.modelB
    });
  };

  const navigateItem = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
    } else if (direction === 'next' && currentItemIndex < totalFilteredItems - 1) {
      setCurrentItemIndex(prev => prev + 1);
    }
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    } else if (direction === 'next' && currentImageIndex < totalImages - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  if (itemsLoading || csvLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">
            {csvLoading ? 'Loading CSV data...' : 'Loading curation data...'}
          </p>
        </div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">No items found for the selected output type.</p>
            <Button onClick={() => setLocation('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const outputTypeLabels = {
    'text': 'Text',
    'bounding-box': 'Bounding Box',
    'svg': 'SVG'
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
          </div>
        </div>
      </header>

      {/* Control Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Selection
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Output Type:</span>
              <span className="px-2 py-1 bg-primary text-white text-sm rounded-md">
                {outputTypeLabels[outputType]}
              </span>
            </div>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center space-x-6">
            {/* Image Navigation */}
            {totalImages > 0 && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Image</span>
                  <span>{currentImageIndex + 1}</span>
                  <span>of</span>
                  <span>{totalImages}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateImage('prev')}
                    disabled={currentImageIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateImage('next')}
                    disabled={currentImageIndex >= totalImages - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Item Navigation */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Item</span>
                <span>{currentItemIndex + 1}</span>
                <span>of</span>
                <span>{totalFilteredItems}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateItem('prev')}
                  disabled={currentItemIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateItem('next')}
                  disabled={currentItemIndex >= totalFilteredItems - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleSaveProgress}
              disabled={savePreferenceMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {savePreferenceMutation.isPending ? 'Saving...' : 'Save Progress'}
            </Button>
          </div>
        </div>
      </div>

      {/* Three Panel Layout */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Input Panel */}
          <InputPanel item={currentItem} currentImageIndex={currentImageIndex} />
          
          {/* Output Panel A */}
          <OutputPanel
            title="Model A Output"
            model="a"
            item={currentItem}
            preference={preference || undefined}
            editedTexts={editedOutputs.modelA}
            onPreferenceChange={handlePreferenceChange}
            onTextEdit={handleTextEdit}
            icon={<Bot className="text-blue-600 w-5 h-5" />}
          />
          
          {/* Output Panel B */}
          <OutputPanel
            title="Model B Output"
            model="b"
            item={currentItem}
            preference={preference || undefined}
            editedTexts={editedOutputs.modelB}
            onPreferenceChange={handlePreferenceChange}
            onTextEdit={handleTextEdit}
            icon={<Bot className="text-purple-600 w-5 h-5" />}
          />
        </div>
      </div>
    </div>
  );
}
