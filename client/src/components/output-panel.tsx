import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { type CurationItem, type UserPreference, type TextOutput, type BoundingBoxOutput, type SvgOutput } from "@shared/schema";
import { ReactNode } from "react";

interface OutputPanelProps {
  title: string;
  model: 'a' | 'b';
  item: CurationItem;
  preference?: UserPreference | null;
  editedTexts?: string[];
  onPreferenceChange: (model: 'a' | 'b', checked: boolean) => void;
  onTextEdit: (model: 'a' | 'b', index: number, text: string) => void;
  icon: ReactNode;
}

export default function OutputPanel({ 
  title, 
  model, 
  item, 
  preference, 
  editedTexts, 
  onPreferenceChange, 
  onTextEdit,
  icon 
}: OutputPanelProps) {
  const output = model === 'a' ? item.modelAOutput : item.modelBOutput;
  const isPreferred = preference?.preferredModel === model;

  const renderOutputContent = () => {
    switch (item.outputType) {
      case 'text':
        // Handle both TextOutput format and simple string array from CSV
        let textItems: Array<{text: string, label?: string, confidence?: number, wordCount?: number}> = [];
        
        if (Array.isArray(output)) {
          // Handle simple string array from CSV
          textItems = output.map((text: string, index: number) => ({
            text: text,
            label: `Text ${index + 1}`,
            confidence: undefined,
            wordCount: text.split(' ').length
          }));
        } else if (output && typeof output === 'object' && 'outputs' in output) {
          // Handle TextOutput format
          const textOutput = output as TextOutput;
          textItems = textOutput.outputs || [];
        } else if (typeof output === 'string') {
          // Handle single string
          textItems = [{
            text: output, 
            label: 'Text',
            confidence: undefined,
            wordCount: output.split(' ').length
          }];
        }
        
        // Show message if no text items found
        if (textItems.length === 0) {
          return (
            <div className="text-center py-8 text-gray-500">
              <p>No text output available</p>
            </div>
          );
        }
        
        return (
          <div className="space-y-4">
            {textItems.map((textItem, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                {textItem.label && (
                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">{textItem.label}</span>
                  </div>
                )}
                <Textarea
                  value={editedTexts?.[index] || textItem.text}
                  onChange={(e) => onTextEdit(model, index, e.target.value)}
                  className="w-full h-32 resize-none mb-2"
                  placeholder={`Model ${model.toUpperCase()} text output ${index + 1}...`}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  {textItem.confidence && <span>Confidence: {textItem.confidence}%</span>}
                  {textItem.wordCount && <span>{textItem.wordCount} words</span>}
                </div>
              </div>
            )) || <div className="text-gray-500">No text outputs available</div>}
          </div>
        );
      
      case 'bounding-box':
        const bboxOutput = output as BoundingBoxOutput;
        const colors = ['blue', 'green', 'red', 'yellow', 'purple', 'orange', 'cyan'];
        return (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="relative">
              <img 
                src={bboxOutput.imageUrl} 
                alt="Object detection results" 
                className="w-full h-auto rounded-lg"
              />
              {bboxOutput.boxes.map((box, index) => {
                const color = colors[index % colors.length];
                return (
                  <div
                    key={index}
                    className={`absolute border-2 border-${color}-500 bg-${color}-500 bg-opacity-10 rounded`}
                    style={{
                      left: `${(box.x / 600) * 100}%`,
                      top: `${(box.y / 400) * 100}%`,
                      width: `${(box.width / 600) * 100}%`,
                      height: `${(box.height / 400) * 100}%`,
                    }}
                  >
                    <span className={`absolute -top-6 left-0 text-xs bg-${color}-500 text-white px-1 rounded whitespace-nowrap`}>
                      {box.label} {Math.round(box.confidence * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Objects Detected:</span>
                <span className="font-medium">{bboxOutput.boxes.length}</span>
              </div>
              {bboxOutput.avgConfidence && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Confidence:</span>
                  <span className="font-medium">{bboxOutput.avgConfidence}%</span>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'svg':
        const svgOutput = output as SvgOutput;
        return (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-center mb-4">
              <div className="w-32 h-32 bg-white rounded-lg shadow-sm flex items-center justify-center">
                <div 
                  dangerouslySetInnerHTML={{ __html: svgOutput.svgContent }}
                  className="w-24 h-24"
                />
              </div>
            </div>
            <div className="text-sm space-y-2">
              {svgOutput.fileSize && (
                <div className="flex justify-between">
                  <span className="text-gray-600">File Size:</span>
                  <span className="font-medium">{svgOutput.fileSize}</span>
                </div>
              )}
              {svgOutput.elementCount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Elements:</span>
                  <span className="font-medium">{svgOutput.elementCount}</span>
                </div>
              )}
              {svgOutput.complexity && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Complexity:</span>
                  <span className={`font-medium ${
                    svgOutput.complexity === 'Low' ? 'text-green-600' :
                    svgOutput.complexity === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {svgOutput.complexity}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-500">Unsupported output type</p>
          </div>
        );
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex justify-between items-center text-lg">
          <div className="flex items-center">
            {icon}
            <span className="ml-2">{title}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`prefer-model-${model}`}
              checked={isPreferred}
              onCheckedChange={(checked) => onPreferenceChange(model, checked as boolean)}
            />
            <label htmlFor={`prefer-model-${model}`} className="text-sm text-gray-600">
              Prefer this
            </label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {renderOutputContent()}
      </CardContent>
    </Card>
  );
}
