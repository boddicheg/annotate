import React, { useRef, useState, useEffect } from 'react';

interface Rectangle {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

interface AnnotationCanvasProps {
  imageUrl: string;
  onAnnotationComplete: (annotations: Rectangle[]) => void;
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({ imageUrl, onAnnotationComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
  const [annotations, setAnnotations] = useState<Rectangle[]>([]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number | null>(null);
  const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState<number | null>(null);

  // Load image and calculate scale
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      // Calculate scale to fit window
      if (canvasRef.current) {
        const windowWidth = window.innerWidth * 0.7; // 70% of window width
        const windowHeight = window.innerHeight * 0.8; // 80% of window height
        const scaleX = windowWidth / img.width;
        const scaleY = windowHeight / img.height;
        const newScale = Math.min(scaleX, scaleY);
        
        setScale(newScale);
        
        // Set canvas size to scaled dimensions
        canvasRef.current.width = img.width * newScale;
        canvasRef.current.height = img.height * newScale;
        
        // Draw image
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    };
  }, [imageUrl]);

  // Draw annotations
  useEffect(() => {
    if (!canvasRef.current || !image) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas and redraw image
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.drawImage(image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw saved annotations
    annotations.forEach((rect, index) => {
      const x = rect.x1 * canvasRef.current!.width;
      const y = rect.y1 * canvasRef.current!.height;
      const width = (rect.x2 - rect.x1) * canvasRef.current!.width;
      const height = (rect.y2 - rect.y1) * canvasRef.current!.height;

      // Draw fill for selected or hovered annotation
      if (index === selectedAnnotationIndex || index === hoveredAnnotationIndex) {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.4)';
        ctx.fillRect(x, y, width, height);
      }

      // Draw rectangle border
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Draw label
      ctx.fillStyle = '#00ff00';
      ctx.font = '14px Arial';
      ctx.fillText(
        rect.label,
        x,
        y - 5
      );
    });

    // Draw current rectangle if drawing
    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        startPoint.x,
        startPoint.y,
        currentPoint.x - startPoint.x,
        currentPoint.y - startPoint.y
      );
    }
  }, [image, annotations, isDrawing, startPoint, currentPoint, selectedAnnotationIndex, hoveredAnnotationIndex]);

  const isPointInRect = (point: { x: number; y: number }, rect: Rectangle, canvasWidth: number, canvasHeight: number) => {
    const x = rect.x1 * canvasWidth;
    const y = rect.y1 * canvasHeight;
    const width = (rect.x2 - rect.x1) * canvasWidth;
    const height = (rect.y2 - rect.y1) * canvasHeight;
    
    return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing) {
      // Handle drawing
      setCurrentPoint({ x, y });
    } else {
      // Handle hover detection
      const hoveredIndex = annotations.findIndex((annotation) => 
        isPointInRect({ x, y }, annotation, canvasRef.current!.width, canvasRef.current!.height)
      );

      if (hoveredIndex !== -1) {
        setHoveredAnnotationIndex(hoveredIndex);
        setSelectedAnnotationIndex(hoveredIndex);
      } else {
        setHoveredAnnotationIndex(null);
        setSelectedAnnotationIndex(null);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !selectedLabel) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!isDrawing) {
      // First click - start drawing
      setIsDrawing(true);
      setStartPoint({ x, y });
      setCurrentPoint({ x, y });
    } else {
      // Second click - finish drawing
      setCurrentPoint({ x, y });
      
      // Add new annotation
      const newAnnotation: Rectangle = {
        x1: Math.min(startPoint!.x, x) / canvasRef.current.width,
        y1: Math.min(startPoint!.y, y) / canvasRef.current.height,
        x2: Math.max(startPoint!.x, x) / canvasRef.current.width,
        y2: Math.max(startPoint!.y, y) / canvasRef.current.height,
        label: selectedLabel
      };

      setAnnotations([...annotations, newAnnotation]);
      onAnnotationComplete([...annotations, newAnnotation]);

      // Reset drawing state
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
    }
  };

  const handleAddLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      const newLabelValue = newLabel.trim();
      setLabels([...labels, newLabelValue]);
      setNewLabel('');
      setSelectedLabel(newLabelValue);
    }
  };

  const handleAnnotationSelect = (index: number) => {
    setSelectedAnnotationIndex(selectedAnnotationIndex === index ? null : index);
  };

  const handleAnnotationDelete = (index: number) => {
    const newAnnotations = annotations.filter((_, i) => i !== index);
    setAnnotations(newAnnotations);
    onAnnotationComplete(newAnnotations);
    if (selectedAnnotationIndex === index) {
      setSelectedAnnotationIndex(null);
    } else if (selectedAnnotationIndex !== null && selectedAnnotationIndex > index) {
      setSelectedAnnotationIndex(selectedAnnotationIndex - 1);
    }
  };

  const handleLabelDelete = (labelToDelete: string) => {
    // Remove the label from labels list
    setLabels(labels.filter(label => label !== labelToDelete));
    
    // Remove all annotations with this label
    const newAnnotations = annotations.filter(rect => rect.label !== labelToDelete);
    setAnnotations(newAnnotations);
    onAnnotationComplete(newAnnotations);

    // Clear selection if the deleted label was selected
    if (selectedLabel === labelToDelete) {
      setSelectedLabel(null);
    }

    // Clear annotation selection if the deleted label had any selected annotations
    if (selectedAnnotationIndex !== null && annotations[selectedAnnotationIndex].label === labelToDelete) {
      setSelectedAnnotationIndex(null);
    }
  };

  return (
    <div className="flex">
      {/* Labels Panel */}
      <div className="w-64 mr-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Labels</h3>
          
          {/* Add new label form */}
          <form onSubmit={handleAddLabel} className="mb-4">
            <div className="flex">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add new label"
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add
              </button>
            </div>
          </form>

          {/* Labels list */}
          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
            {labels.map((label) => (
              <div
                key={label}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm ${
                  selectedLabel === label
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <button
                  onClick={() => setSelectedLabel(label)}
                  className="flex-grow text-left"
                >
                  {label}
                </button>
                <button
                  onClick={() => handleLabelDelete(label)}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-grow flex justify-center">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        />
      </div>

      {/* Annotations List */}
      <div className="w-64 ml-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Annotations</h3>
        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {annotations.map((rect, index) => (
            <div 
              key={index} 
              className={`bg-gray-50 p-2 rounded flex justify-between items-center ${
                selectedAnnotationIndex === index ? 'ring-2 ring-indigo-500' : ''
              }`}
            >
              <button
                onClick={() => handleAnnotationSelect(index)}
                className="flex-grow text-left"
              >
                <span className="text-sm text-gray-600">
                  {rect.label}: ({rect.x1.toFixed(3)}, {rect.y1.toFixed(3)}) - ({rect.x2.toFixed(3)}, {rect.y2.toFixed(3)})
                </span>
              </button>
              <button
                onClick={() => handleAnnotationDelete(index)}
                className="ml-2 text-gray-400 hover:text-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnotationCanvas; 