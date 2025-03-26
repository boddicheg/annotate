import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';

interface Rectangle {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  id: number;
}

interface AnnotationCanvasProps {
  projectUuid: string;
  imageUuid: string;
  imageUrl: string;
}

// Add Label interface
interface Label {
  id: number;
  name: string;
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({ 
  projectUuid, 
  imageUuid, 
  imageUrl 
}) => {
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
  const [annotations, setAnnotations] = useState<Rectangle[]>([]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);
  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number | null>(null);
  const [hoveredAnnotationIndex, setHoveredAnnotationIndex] = useState<number | null>(null);

  // Fetch project labels when component mounts
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/projects/${projectUuid}/labels`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setLabels(data);  // Store the full label objects
        }
      } catch (error) {
        console.error('Error fetching labels:', error);
      }
    };

    fetchLabels();
  }, [projectUuid]);

  // Fetch existing annotations when component mounts
  useEffect(() => {
    const fetchAnnotations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/images/${imageUuid}/annotations`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAnnotations(data.map((annotation: any) => ({
            id: annotation.id,
            x1: annotation.x,
            y1: annotation.y,
            x2: annotation.x + annotation.width,
            y2: annotation.y + annotation.height,
            label: annotation.label.name
          })));
        }
      } catch (error) {
        console.error('Error fetching annotations:', error);
      }
    };

    if (imageWidth && imageHeight) {
      fetchAnnotations();
    }
  }, [imageUuid, imageWidth, imageHeight]);

  // Save annotation to backend
  const saveAnnotation = async (annotation: Rectangle) => {
    try {
      const token = localStorage.getItem('token');
      const labelId = labels.find(l => l.name === annotation.label)?.id || 0; // Assuming label IDs start from 1
      
      const response = await fetch(`/api/images/${imageUuid}/annotations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          label_id: labelId,
          x: annotation.x1,
          y: annotation.y1,
          width: annotation.x2 - annotation.x1,
          height: annotation.y2 - annotation.y1,
          coordinate_format: 'uv' // Indicate that we're sending UV coordinates
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save annotation');
      }
    } catch (error) {
      console.error('Error saving annotation:', error);
    }
  };

  // Delete annotation from backend
  const deleteAnnotationFromBackend = async (annotation: Rectangle) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/images/${imageUuid}/annotations/${annotation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete annotation');
      }
    } catch (error) {
      console.error('Error deleting annotation:', error);
    }
  };

  // Load image and calculate scale
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      setImageWidth(img.width);
      setImageHeight(img.height);
      
      if (canvasRef.current) {
        const targetWidth = 800;
        let newScale = 1;
        
        // Only scale down if image is wider than target width
        if (img.width > targetWidth) {
          newScale = targetWidth / img.width;
        }
        
        setScale(newScale);
        
        // Set canvas size to scaled dimensions
        canvasRef.current.width = img.width * newScale;
        canvasRef.current.height = img.height * newScale;
        
        // Draw image
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width * newScale, img.height * newScale);
        }
      }
    };
  }, [imageUrl]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / (imageWidth * scale),
      y: (e.clientY - rect.top) / (imageHeight * scale)
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedLabel) {
      showToast('Please select a label first', 'error');
      return;
    }

    const pos = getMousePos(e);
    if (!pos) return;

    setIsDrawing(true);
    setStartPoint(pos);
    setCurrentPoint(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    if (!pos) return;

    if (isDrawing) {
      setCurrentPoint(pos);
    } else {
      // Check if mouse is over any annotation
      const hoveredIndex = annotations.findIndex(rect => {
        const isInXBounds = pos.x >= rect.x1 && pos.x <= rect.x2;
        const isInYBounds = pos.y >= rect.y1 && pos.y <= rect.y2;
        return isInXBounds && isInYBounds;
      });
      
      setHoveredAnnotationIndex(hoveredIndex !== -1 ? hoveredIndex : null);
    }
  };

  const handleMouseUp = async () => {
    if (!isDrawing || !startPoint || !currentPoint || !selectedLabel) return;

    // Create new annotation without ID first
    const newAnnotation: Omit<Rectangle, 'id'> = {
      x1: Math.min(startPoint.x, currentPoint.x),
      y1: Math.min(startPoint.y, currentPoint.y),
      x2: Math.max(startPoint.x, currentPoint.x),
      y2: Math.max(startPoint.y, currentPoint.y),
      label: selectedLabel
    };

    // Only proceed if the rectangle has some size
    if (Math.abs(newAnnotation.x2 - newAnnotation.x1) > 0.01 && 
        Math.abs(newAnnotation.y2 - newAnnotation.y1) > 0.01) {
      try {
        const token = localStorage.getItem('token');
        const labelId = labels.find(l => l.name === selectedLabel)?.id;
        
        if (!labelId) {
          throw new Error('Label not found');
        }

        const response = await fetch(`/api/images/${imageUuid}/annotations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            label_id: labelId,
            x: newAnnotation.x1,
            y: newAnnotation.y1,
            width: newAnnotation.x2 - newAnnotation.x1,
            height: newAnnotation.y2 - newAnnotation.y1,
            coordinate_format: 'uv'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save annotation');
        }

        // Get the created annotation with its ID from the response
        const savedAnnotation = await response.json();
        
        // Add the new annotation with the server-assigned ID
        setAnnotations([...annotations, {
          ...newAnnotation,
          id: savedAnnotation.id
        }]);
      } catch (error) {
        console.error('Error saving annotation:', error);
      }
    }

    // Reset drawing state
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
    setHoveredAnnotationIndex(null);
  };

  // Draw function
  const draw = useCallback(() => {
    if (!canvasRef.current || !image) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw image
    ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);

    // Draw all annotations
    annotations.forEach((rect, index) => {
      ctx.strokeStyle = index === selectedAnnotationIndex ? '#00ff00' : 
                       index === hoveredAnnotationIndex ? '#0088ff' : '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        rect.x1 * imageWidth * scale,
        rect.y1 * imageHeight * scale,
        (rect.x2 - rect.x1) * imageWidth * scale,
        (rect.y2 - rect.y1) * imageHeight * scale
      );

      // Draw label
      if (rect.label) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
          rect.x1 * imageWidth * scale,
          rect.y1 * imageHeight * scale - 20,
          ctx.measureText(rect.label).width + 10,
          20
        );
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(rect.label, rect.x1 * imageWidth * scale + 5, rect.y1 * imageHeight * scale - 5);
      }
    });

    // Draw current rectangle if drawing
    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        startPoint.x * imageWidth * scale,
        startPoint.y * imageHeight * scale,
        (currentPoint.x - startPoint.x) * imageWidth * scale,
        (currentPoint.y - startPoint.y) * imageHeight * scale
      );
    }
  }, [image, annotations, isDrawing, startPoint, currentPoint, selectedAnnotationIndex, hoveredAnnotationIndex, scale, imageWidth, imageHeight]);

  // Use effect to redraw when needed
  useEffect(() => {
    draw();
  }, [draw]);

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabel?.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectUuid}/labels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: selectedLabel.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to create label');
      }

      // Get the newly created label name
      const newLabelName = selectedLabel.trim();

      // Fetch updated labels
      const labelsResponse = await fetch(`/api/projects/${projectUuid}/labels`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (labelsResponse.ok) {
        const data = await labelsResponse.json();
        setLabels(data);
        // Select the newly added label
        setSelectedLabel(newLabelName);
      }

      // Clear input
      setSelectedLabel(newLabelName);
    } catch (error) {
      console.error('Error creating label:', error);
    }
  };

  const handleAnnotationSelect = (index: number) => {
    setSelectedAnnotationIndex(selectedAnnotationIndex === index ? null : index);
  };

  const handleAnnotationDelete = (index: number) => {
    const annotation = annotations[index];
    deleteAnnotationFromBackend(annotation);
    const newAnnotations = annotations.filter((_, i) => i !== index);
    setAnnotations(newAnnotations);
    if (selectedAnnotationIndex === index) {
      setSelectedAnnotationIndex(null);
    } else if (selectedAnnotationIndex !== null && selectedAnnotationIndex > index) {
      setSelectedAnnotationIndex(selectedAnnotationIndex - 1);
    }
  };

  const handleLabelDelete = async (label: Label) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectUuid}/labels/${label.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete label');
        return;
      }

      // Remove the label from labels list
      setLabels(labels.filter(l => l.id !== label.id));
      
      // Remove all annotations with this label
      const newAnnotations = annotations.filter(rect => rect.label !== label.name);
      setAnnotations(newAnnotations);

      // Clear selection if the deleted label was selected
      if (selectedLabel === label.name) {
        setSelectedLabel(null);
      }

      // Clear annotation selection if the deleted label had any selected annotations
      if (selectedAnnotationIndex !== null && annotations[selectedAnnotationIndex].label === label.name) {
        setSelectedAnnotationIndex(null);
      }
    } catch (error) {
      console.error('Error deleting label:', error);
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
                value={selectedLabel || ''}
                onChange={(e) => setSelectedLabel(e.target.value)}
                placeholder="Add new label"
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <button
                type="submit"
                disabled={!selectedLabel?.trim()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </form>

          {/* Labels list */}
          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
            {labels.map((label) => (
              <div
                key={label.id}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm ${
                  selectedLabel === label.name
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <button
                  onClick={() => setSelectedLabel(label.name)}
                  className="flex-grow text-left"
                >
                  {label.name}
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
      <div className="flex-grow">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="border border-gray-200 rounded"
        />
      </div>

      {/* Annotations List Panel */}
      <div className="w-64 ml-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Annotations</h3>
          <div 
            className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-2
            scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 
            hover:scrollbar-thumb-gray-500"
          >
            {annotations.map((rect, index) => (
              <div
                key={index}
                onClick={() => handleAnnotationSelect(index)}
                className={`bg-white p-3 rounded-md shadow-sm border cursor-pointer
                  ${selectedAnnotationIndex === index 
                    ? 'border-indigo-500' 
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm text-gray-900">{rect.label}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAnnotationDelete(index);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  <div>Top-left: ({rect.x1.toFixed(3)}, {rect.y1.toFixed(3)})</div>
                  <div>Bottom-right: ({rect.x2.toFixed(3)}, {rect.y2.toFixed(3)})</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnotationCanvas; 