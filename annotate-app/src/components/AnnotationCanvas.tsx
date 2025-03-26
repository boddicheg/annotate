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
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    annotations.forEach(rect => {
      ctx.strokeRect(
        rect.x1 * canvasRef.current!.width,
        rect.y1 * canvasRef.current!.height,
        (rect.x2 - rect.x1) * canvasRef.current!.width,
        (rect.y2 - rect.y1) * canvasRef.current!.height
      );
      
      // Draw label
      ctx.fillStyle = '#00ff00';
      ctx.font = '14px Arial';
      ctx.fillText(
        rect.label,
        rect.x1 * canvasRef.current!.width,
        rect.y1 * canvasRef.current!.height - 5
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
  }, [image, annotations, isDrawing, startPoint, currentPoint]);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPoint({ x, y });
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
              <button
                key={label}
                onClick={() => setSelectedLabel(label)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  selectedLabel === label
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
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
            <div key={index} className="bg-gray-50 p-2 rounded">
              <span className="text-sm text-gray-600">
                {rect.label}: ({rect.x1.toFixed(3)}, {rect.y1.toFixed(3)}) - ({rect.x2.toFixed(3)}, {rect.y2.toFixed(3)})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnotationCanvas; 