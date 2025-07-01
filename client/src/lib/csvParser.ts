import { type OutputType } from "./types";

export interface CSVRow {
  [key: string]: string;
}

export interface ParsedCSVData {
  headers: string[];
  rows: CSVRow[];
}

export function parseCSV(csvText: string): ParsedCSVData {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header and one data row');
  }

  // Parse CSV with proper handling of quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue; // Skip empty lines
    
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, ''));
    
    // Create row even if column count doesn't match exactly
    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = index < values.length ? values[index] : '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function extractModelOutput(csvData: ParsedCSVData, outputType: OutputType, imageIndex: number): any {
  switch (outputType) {
    case 'text':
      // Get unique filenames to understand how many images we have
      const filenames = csvData.rows.map(row => row['filename']).filter(f => f && f.trim() !== '');
      const uniqueFilenames: string[] = [];
      
      // Manual unique array creation to avoid Set iteration issues
      for (const filename of filenames) {
        if (uniqueFilenames.indexOf(filename) === -1) {
          uniqueFilenames.push(filename);
        }
      }
      
      if (imageIndex >= uniqueFilenames.length) {
        return ['No text data'];
      }
      
      const targetFilename = uniqueFilenames[imageIndex];
      
      // Get all rows for this filename and extract text
      const textEntries = csvData.rows
        .filter(row => row['filename'] === targetFilename)
        .map(row => {
          const text = row['text'] && row['text'].trim() !== '' ? row['text'] : 'No text';
          const tag = row['tag'] && row['tag'].trim() !== '' ? row['tag'] : 'text';
          return `${tag}: ${text}`;
        })
        .filter(text => !text.includes('No text'));
      
      return textEntries.length > 0 ? textEntries : ['No text data'];

    case 'bounding-box':
      // Look for bbox column
      if (csvData.rows[imageIndex] && csvData.rows[imageIndex]['bbox']) {
        const row = csvData.rows[imageIndex];
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(row['bbox']);
          if (Array.isArray(parsed)) {
            return { boundingBoxes: parsed, imageUrl: '' };
          } else {
            return { boundingBoxes: [parsed], imageUrl: '' };
          }
        } catch {
          // If not JSON, try to parse as comma-separated coordinates
          if (row['bbox'].includes(',')) {
            const coords = row['bbox'].split(',').map(Number);
            if (coords.length >= 4) {
              const [x, y, width, height] = coords;
              return { 
                boundingBoxes: [{ x, y, width, height }], 
                imageUrl: '' 
              };
            }
          }
        }
      }
      return { boundingBoxes: [], imageUrl: '' };

    case 'svg':
      // Look for tag column (assuming this contains SVG content)
      if (csvData.rows[imageIndex] && csvData.rows[imageIndex]['tag']) {
        const row = csvData.rows[imageIndex];
        return { svgContent: row['tag'] };
      }
      // Fallback to other columns
      const svgColumns = ['svg', 'svg_path', 'svg_file', 'path'];
      for (const col of svgColumns) {
        if (csvData.rows[imageIndex] && csvData.rows[imageIndex][col]) {
          return { svgContent: csvData.rows[imageIndex][col] };
        }
      }
      return { svgContent: '' };

    default:
      return null;
  }
}