import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image as ImageIcon } from "lucide-react";
import { type CurationItem, type BoundingBoxOutput } from "@shared/schema";
import { useState, useEffect } from "react";

interface InputPanelProps {
  item: CurationItem;
  currentImageIndex?: number;
}

interface StoredImage {
  name: string;
  path: string;
  url: string;
}

export default function InputPanel({ item, currentImageIndex = 0 }: InputPanelProps) {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [currentImage, setCurrentImage] = useState<StoredImage | null>(null);

  useEffect(() => {
    // Load images from sessionStorage
    const storedImages = sessionStorage.getItem('selectedImages');
    if (storedImages) {
      const imageArray = JSON.parse(storedImages) as StoredImage[];
      setImages(imageArray);
      
      // Set current image based on index
      if (imageArray.length > currentImageIndex) {
        setCurrentImage(imageArray[currentImageIndex]);
      }
    }
  }, [currentImageIndex]);

  const renderInputContent = () => {
    // If we have images from folder selection, show them
    if (currentImage) {
      return (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <img 
            src={currentImage.url} 
            alt={`Input image: ${currentImage.name}`}
            className="w-full h-auto rounded-lg shadow-sm mb-3"
          />
          <div className="text-sm text-gray-600">
            <p className="font-medium">{currentImage.name}</p>
            <p className="text-xs text-gray-500">{currentImage.path}</p>
          </div>
        </div>
      );
    }

    // Fallback to original content based on output type
    switch (item.outputType) {
      case 'text':
        return (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {item.inputData}
            </p>
          </div>
        );
      
      case 'bounding-box':
        const bboxOutput = item.modelAOutput as BoundingBoxOutput;
        return (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <img 
              src={bboxOutput.imageUrl} 
              alt="Input image for object detection" 
              className="w-full h-auto rounded-lg shadow-sm"
            />
            <p className="text-sm text-gray-600 mt-2">Original image for object detection analysis</p>
          </div>
        );
      
      case 'svg':
        return (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-800 mb-4 whitespace-pre-wrap">
              {item.inputData}
            </p>
          </div>
        );
      
      default:
        return (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-500">Unsupported input type</p>
          </div>
        );
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          {currentImage ? (
            <>
              <ImageIcon className="text-primary w-5 h-5 mr-2" />
              Image Input
            </>
          ) : (
            <>
              <Upload className="text-primary w-5 h-5 mr-2" />
              Input
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {renderInputContent()}
      </CardContent>
    </Card>
  );
}
