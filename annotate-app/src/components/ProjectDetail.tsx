import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProjectById, ProjectsInterface } from "../services/Api";
import { useAuth } from "../context/AuthContext";
// import moment from 'moment';

const ProjectDetail: React.FC = () => {
  const { projectUuid } = useParams<{ projectUuid: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [project, setProject] = useState<ProjectsInterface | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("data");

  useEffect(() => {
    const getProject = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      try {
        if (!projectUuid) {
          setError('Project ID is missing');
          setLoading(false);
          return;
        }

        const projectData = await fetchProjectById(projectUuid);
        setProject(projectData);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching project:', err);
        
        // Check if it's an authentication error
        if (err.message && (err.message.includes('Authentication') || err.message.includes('token'))) {
          navigate('/login');
        } else if (err.message && err.message.includes('not found')) {
          setError('Project not found');
        } else {
          setError('Failed to load project');
        }
        
        setLoading(false);
      }
    };

    getProject();
  }, [projectUuid, navigate, isAuthenticated]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button 
          onClick={() => navigate('/projects')}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Notice: </strong>
          <span className="block sm:inline">Project not found</span>
        </div>
        <button 
          onClick={() => navigate('/projects')}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Project Header */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/projects')}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
            {project.type === 'classification' ? 'Classification' : 'Object Detection'}
          </span>
        </div>
        <div className="flex space-x-2">
          <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50">
            Settings
          </button>
          <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">
            Export
          </button>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm font-medium text-gray-500">Images</h3>
          <p className="text-2xl font-semibold">{project.resources || 0}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm font-medium text-gray-500">Annotations</h3>
          <p className="text-2xl font-semibold">0</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-sm font-medium text-gray-500">Models</h3>
          <p className="text-2xl font-semibold">0</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex">
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'data' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('data')}
          >
            Data
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'annotate' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('annotate')}
          >
            Annotate
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'train' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('train')}
          >
            Train
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'deploy' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('deploy')}
          >
            Deploy
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-grow p-4 bg-gray-50 overflow-auto">
        {activeTab === 'data' && (
          <div>
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-medium mb-4">Upload Data</h2>
              <p className="text-gray-600 mb-4">
                Upload images to your project. Supported formats: JPG, PNG.
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">Drag and drop files here, or click to select files</p>
                <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                  Select Files
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'annotate' && (
          <div>
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-medium mb-4">Annotation Tools</h2>
              <p className="text-gray-600 mb-4">
                Start annotating your images to train your model.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded p-4">
                  <h3 className="font-medium">Manual Annotation</h3>
                  <p className="text-sm text-gray-600 mt-2">Annotate images yourself using our annotation tools.</p>
                  <button className="mt-4 bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">
                    Start Annotating
                  </button>
                </div>
                <div className="border border-gray-200 rounded p-4">
                  <h3 className="font-medium">Auto Annotation</h3>
                  <p className="text-sm text-gray-600 mt-2">Use AI to automatically annotate your images.</p>
                  <button className="mt-4 bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'train' && (
          <div>
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-medium mb-4">Train Model</h2>
              <p className="text-gray-600 mb-4">
                Configure and train your model using your annotated data.
              </p>
              <div className="border border-gray-200 rounded p-4">
                <h3 className="font-medium">Model Configuration</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model Type</label>
                    <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      <option>YOLOv5</option>
                      <option>Faster R-CNN</option>
                      <option>EfficientDet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Epochs</label>
                    <input type="number" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" defaultValue={100} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Batch Size</label>
                    <input type="number" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" defaultValue={16} />
                  </div>
                </div>
                <button className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                  Start Training
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deploy' && (
          <div>
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-medium mb-4">Deploy Model</h2>
              <p className="text-gray-600 mb-4">
                Deploy your trained model to make predictions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded p-4">
                  <h3 className="font-medium">API Endpoint</h3>
                  <p className="text-sm text-gray-600 mt-2">Deploy your model as an API endpoint.</p>
                  <button className="mt-4 bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">
                    Deploy API
                  </button>
                </div>
                <div className="border border-gray-200 rounded p-4">
                  <h3 className="font-medium">Download Model</h3>
                  <p className="text-sm text-gray-600 mt-2">Download your trained model for local use.</p>
                  <button className="mt-4 bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail; 