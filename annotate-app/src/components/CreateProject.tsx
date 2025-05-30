import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendAddNewProject } from "../services/Api";
import { useAuth } from "../context/AuthContext";

const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [projectType, setProjectType] = useState<string>('object-detection');
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const data = { name, description, type: projectType };

    try {
      // Debug token before creating project
      const token = localStorage.getItem('token');
      console.log('Token when creating project:', token);
      
      if (!token) {
        navigate("/login");
        return;
      }
      
      await sendAddNewProject(data);
      navigate('/projects');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        console.error('Project creation error:', err.message);
        
        // Check if the error is due to authentication
        if (err.message.includes("Authentication") || err.message.includes("token")) {
          // Redirect to login page
          navigate("/login");
        }
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      
      <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
        
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  autoComplete="name"
                  required
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="My Awesome Project"
                />
              </div>
            </div>
            
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  rows={3}
                  required
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Describe your project"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Project Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className={`flex items-center p-5 border rounded-lg cursor-pointer transition-colors ${projectType === 'object-detection' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}
                onClick={() => setProjectType('object-detection')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 mr-4 ${projectType === 'object-detection' ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <div className={`text-base font-medium ${projectType === 'object-detection' ? 'text-indigo-700' : 'text-gray-900'}`}>Object Detection</div>
                  <div className="text-sm text-gray-500 mt-1">Detect and locate objects in images</div>
                </div>
              </div>
              
              <div 
                className={`flex items-center p-5 border rounded-lg cursor-pointer transition-colors ${projectType === 'classification' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:bg-gray-50'}`}
                onClick={() => setProjectType('classification')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 mr-4 ${projectType === 'classification' ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <div>
                  <div className={`text-base font-medium ${projectType === 'classification' ? 'text-indigo-700' : 'text-gray-900'}`}>Classification</div>
                  <div className="text-sm text-gray-500 mt-1">Classify whole images into categories</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject; 