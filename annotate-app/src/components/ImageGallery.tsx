import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';

interface ImageData {
  id: number;
  uuid: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  upload_date: string;
  project_id: number;
  user_id: number;
}

interface ImageGalleryProps {
  projectUuid: string;
  onImageSelect?: (imageUrl: string) => void;
  selectable?: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ projectUuid, onImageSelect, selectable = false }) => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Function to get secure image URL with authentication
  const getSecureImageUrl = (filePath: string): string => {
    const relativePath = filePath.split('/').slice(1).join('/');
    const token = localStorage.getItem('token');
    return `/api/images/${relativePath}?token=${token}`;
  };

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token is missing');
        }

        const response = await fetch(`/api/projects/uuid/${projectUuid}/images`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed: Invalid or expired token');
          }
          throw new Error('Failed to fetch images');
        }

        const data = await response.json();
        setImages(data);
      } catch (err) {
        console.error('Error fetching images:', err);
        if (err instanceof Error) {
          setError(err.message);
          showToast(err.message, 'error');
        } else {
          setError('An unexpected error occurred');
          showToast('Failed to load images', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    if (projectUuid) {
      fetchImages();
    }
  }, [projectUuid, showToast]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const toggleDropdown = (imageUuid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === imageUuid ? null : imageUuid);
  };

  const handleDownloadImage = (image: ImageData, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = getSecureImageUrl(image.file_path);
    link.download = image.original_filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteImage = async (image: ImageData, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    
    if (!confirm(`Are you sure you want to delete ${image.original_filename}?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      const response = await fetch(`/api/projects/images/${image.uuid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed: Invalid or expired token');
        }
        throw new Error('Failed to delete image');
      }

      // Remove the deleted image from the state
      setImages(images.filter(img => img.uuid !== image.uuid));
      showToast('Image deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting image:', err);
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Failed to delete image', 'error');
      }
    }
  };

  const handleImageClick = (image: ImageData, e: React.MouseEvent) => {
    if (selectable && onImageSelect) {
      e.stopPropagation();
      onImageSelect(getSecureImageUrl(image.file_path));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">No images found: </strong>
        <span className="block sm:inline">This project doesn't have any images yet. Go to the Upload tab to add images.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Project Images ({images.length})</h2>
        <div className="text-sm text-gray-500">
          Total: {images.length} image{images.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((image) => (
          <div 
            key={image.uuid} 
            className={`bg-white rounded-lg shadow overflow-hidden relative group ${
              selectable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
            }`}
            onClick={(e) => handleImageClick(image, e)}
          >
            <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
              <img 
                src={getSecureImageUrl(image.file_path)} 
                alt={image.original_filename}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="p-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900 truncate" title={image.original_filename}>
                  {image.original_filename}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(image.file_size)}</p>
              </div>
              
              {/* Options button */}
              <div className="relative">
                <button 
                  onClick={(e) => toggleDropdown(image.uuid, e)}
                  className="bg-gray-100 hover:bg-gray-200 rounded-full p-1 text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                {openDropdownId === image.uuid && (
                  <div 
                    ref={dropdownRef}
                    className="absolute right-0 bottom-full mb-1 w-48 bg-white rounded-md shadow-lg z-10"
                  >
                    <div className="py-1">
                      <button
                        onClick={(e) => handleDownloadImage(image, e)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                      <button
                        onClick={(e) => handleDeleteImage(image, e)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery; 