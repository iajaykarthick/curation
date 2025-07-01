import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { OutputType } from '@/lib/types';
import { parseCSV, extractModelOutput, ParsedCSVData } from '@/lib/csvParser';

interface ImageData {
  file: File;
  url: string;
  filename: string;
  modelAOutputs?: any;
  modelBOutputs?: any;
  tags?: string[];
  graphicType?: string;
}

export default function Gallery() {
  const [, setLocation] = useLocation();
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [graphicTypeFilter, setGraphicTypeFilter] = useState<string>('');
  const [showOverlays, setShowOverlays] = useState(true);
  const [outputType, setOutputType] = useState<OutputType | null>(null);
  const [csvData, setCSVData] = useState<{
    modelA: ParsedCSVData | null;
    modelB: ParsedCSVData | null;
  }>({ modelA: null, modelB: null });

  // Load data from sessionStorage
  useEffect(() => {
    const loadGalleryData = async () => {
      try {
        // Load selected output type
        const storedOutputType = sessionStorage.getItem('selectedOutputType');
        if (storedOutputType) {
          setOutputType(storedOutputType as OutputType);
        }

        // Load images
        const storedImages = sessionStorage.getItem('selectedImages');
        let imageDataArray: ImageData[] = [];
        
        if (storedImages) {
          const imageFiles = JSON.parse(storedImages) as File[];

          for (const file of imageFiles) {
            const url = URL.createObjectURL(file);
            imageDataArray.push({
              file,
              url,
              filename: file.name,
            });
          }
          setImages(imageDataArray);
        }

        // Load CSV data
        const [modelACSV, modelBCSV] = await Promise.all([
          sessionStorage.getItem('modelA_csv'),
          sessionStorage.getItem('modelB_csv')
        ]);

        if (modelACSV && modelBCSV && imageDataArray.length > 0) {
          const parsedModelA = parseCSV(modelACSV);
          const parsedModelB = parseCSV(modelBCSV);
          setCSVData({ modelA: parsedModelA, modelB: parsedModelB });

          // Enhance image data with CSV information
          if (parsedModelA && parsedModelB) {
            const enhancedImages = imageDataArray.map((img: ImageData, index: number) => {
              const modelAOutput = extractModelOutput(parsedModelA, storedOutputType as OutputType, index);
              const modelBOutput = extractModelOutput(parsedModelB, storedOutputType as OutputType, index);
              
              // Extract tags and graphic types from CSV
              const imageRows = parsedModelA.rows.filter(row => row.filename === img.filename);
              // Manual unique array creation to avoid Set iteration issues
              const tagsSet = imageRows.map(row => row.tag).filter(tag => tag && tag.trim() !== '');
              const tags: string[] = [];
              for (const tag of tagsSet) {
                if (tags.indexOf(tag) === -1) {
                  tags.push(tag);
                }
              }
              const graphicType = imageRows[0]?.graphicType || '';

              return {
                ...img,
                modelAOutputs: modelAOutput,
                modelBOutputs: modelBOutput,
                tags,
                graphicType
              };
            });
            setImages(enhancedImages);
          }
        }
      } catch (error) {
        console.error('Failed to load gallery data:', error);
      }
    };

    loadGalleryData();
  }, []);

  // Get unique tags and graphic types for filters
  const { uniqueTags, uniqueGraphicTypes } = useMemo(() => {
    const tags = new Set<string>();
    const graphicTypes = new Set<string>();
    
    images.forEach(img => {
      img.tags?.forEach(tag => tags.add(tag));
      if (img.graphicType) graphicTypes.add(img.graphicType);
    });

    return {
      uniqueTags: Array.from(tags).sort(),
      uniqueGraphicTypes: Array.from(graphicTypes).sort()
    };
  }, [images]);

  // Filter images based on search and filters
  const filteredImages = useMemo(() => {
    return images.filter(img => {
      const matchesSearch = img.filename.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = !tagFilter || img.tags?.includes(tagFilter);
      const matchesGraphicType = !graphicTypeFilter || img.graphicType === graphicTypeFilter;
      
      return matchesSearch && matchesTag && matchesGraphicType;
    });
  }, [images, searchTerm, tagFilter, graphicTypeFilter]);

  const handleImageSelect = (filename: string, selected: boolean) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(filename);
      } else {
        newSet.delete(filename);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedImages(new Set(filteredImages.map(img => img.filename)));
  };

  const handleDeselectAll = () => {
    setSelectedImages(new Set());
  };

  const handleProceedToCuration = () => {
    // Filter images to only selected ones and store in sessionStorage
    const selectedImageFiles = images
      .filter(img => selectedImages.has(img.filename))
      .map(img => img.file);
    
    sessionStorage.setItem('selectedImages', JSON.stringify(selectedImageFiles));
    setLocation('/curation');
  };

  const renderImageOverlay = (img: ImageData) => {
    if (!showOverlays || !outputType || (!img.modelAOutputs && !img.modelBOutputs)) {
      return null;
    }

    if (outputType === 'text') {
      const textA = Array.isArray(img.modelAOutputs) ? img.modelAOutputs : [];
      const textB = Array.isArray(img.modelBOutputs) ? img.modelBOutputs : [];
      const allTexts = [...textA, ...textB].slice(0, 3); // Show first 3 texts

      return (
        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-200 p-2 overflow-hidden">
          <div className="text-white text-xs space-y-1">
            {allTexts.map((text, i) => (
              <div key={i} className="truncate bg-black/50 px-1 rounded">
                {typeof text === 'string' ? text : ''}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (outputType === 'bounding-box') {
      // For bounding boxes, we'd need to render actual boxes on the image
      // This is a placeholder - would need more complex implementation
      return (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200">
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            Bounding Boxes Available
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Image Gallery</h1>
          <p className="text-muted-foreground">
            Select images for curation. {outputType && `Viewing ${outputType} outputs.`}
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search by filename</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {uniqueTags.length > 0 && (
              <div className="min-w-[150px]">
                <Label>Filter by tag</Label>
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All tags</SelectItem>
                    {uniqueTags.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {uniqueGraphicTypes.length > 0 && (
              <div className="min-w-[150px]">
                <Label>Filter by type</Label>
                <Select value={graphicTypeFilter} onValueChange={setGraphicTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {uniqueGraphicTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(outputType === 'text' || outputType === 'bounding-box') && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-overlays"
                  checked={showOverlays}
                  onCheckedChange={(checked) => setShowOverlays(!!checked)}
                />
                <Label htmlFor="show-overlays" className="flex items-center gap-2">
                  {showOverlays ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  Show overlays
                </Label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {filteredImages.length} of {images.length} images
              </Badge>
              <Badge variant="outline">
                {selectedImages.size} selected
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All ({filteredImages.length})
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>
          </div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {filteredImages.map((img) => (
            <Card key={img.filename} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="w-full h-full object-cover"
                  />
                  {renderImageOverlay(img)}
                  
                  {/* Selection checkbox */}
                  <div className="absolute top-2 right-2">
                    <Checkbox
                      checked={selectedImages.has(img.filename)}
                      onCheckedChange={(checked) => handleImageSelect(img.filename, !!checked)}
                      className="bg-white/90 border-2"
                    />
                  </div>
                </div>
                
                <div className="p-3">
                  <p className="text-sm font-medium truncate" title={img.filename}>
                    {img.filename}
                  </p>
                  
                  {/* Tags and metadata */}
                  <div className="mt-2 space-y-1">
                    {img.graphicType && (
                      <Badge variant="secondary" className="text-xs">
                        {img.graphicType}
                      </Badge>
                    )}
                    {img.tags && img.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {img.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {img.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{img.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <Filter className="mx-auto w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No images found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" onClick={() => setLocation('/')}>
            Back to Upload
          </Button>
          
          <Button 
            onClick={handleProceedToCuration}
            disabled={selectedImages.size === 0}
            className="flex items-center gap-2"
          >
            Proceed to Curation ({selectedImages.size} selected)
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}