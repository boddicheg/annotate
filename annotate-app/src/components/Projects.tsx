import React, { useEffect, useState, useRef } from "react";
import { fetchProjects, ProjectsInterface, deleteProject } from "../services/Api";
import { useNavigate } from "react-router-dom";
import moment from 'moment';
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
// import AddProjectModal from './AddProjectModal';

export const ProjectsList = ({
  projects,
  onDeleteProject
}: {
  projects?: Array<ProjectsInterface>;
  onDeleteProject: (projectUuid: string) => void;
}) => {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  
  const handleProjectClick = (projectUuid: string) => {
    navigate(`/projects/${projectUuid}`);
  };
  
  const toggleDropdown = (e: React.MouseEvent, projectUuid: string) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === projectUuid ? null : projectUuid);
  };
  
  const handleCopyUuid = (e: React.MouseEvent, projectUuid: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(projectUuid);
    setActiveDropdown(null);
    showToast("UUID copied to clipboard!", "success");
  };
  
  const handleDeleteProject = (e: React.MouseEvent, projectUuid: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      onDeleteProject(projectUuid);
    }
    setActiveDropdown(null);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4" ref={dropdownRef}>
      {projects &&
        projects?.map((project) => (
          <div 
            key={project.uuid} 
            className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleProjectClick(project.uuid)}
          >
            {/* Project Header with thumbnail */}
            <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
              <div className="absolute top-3 left-3 bg-gray-800 bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {project.type === 'classification' ? 'Classification' : 'Object Detection'}
              </div>
            </div>
            
            {/* Project Info */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.description}</p>
                </div>
                <div className="relative">
                  <button 
                    className="text-gray-400 hover:text-gray-500"
                    onClick={(e) => toggleDropdown(e, project.uuid)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeDropdown === project.uuid && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                      <div className="py-1">
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={(e) => handleCopyUuid(e, project.uuid)}
                        >
                          Copy UUID
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          onClick={(e) => handleDeleteProject(e, project.uuid)}
                        >
                          Delete Project
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Project Stats */}
              <div className="mt-4 flex items-center text-sm text-gray-500 space-x-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {project.resources} Images
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  1 Model
                </div>
              </div>
              
              {/* Last Updated */}
              <div className="mt-4 text-xs text-gray-500">
                Edited {moment(project.date_updated).fromNow()}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Array<ProjectsInterface>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState<boolean>(false);
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const getProjects = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    try {
      // Debug token before fetching projects
      const token = localStorage.getItem('token');
      console.log('Token when fetching projects:', token);
      
      if (!token) {
        navigate("/login");
        return;
      }
      
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        console.error('Project fetch error:', err.message);
        
        // Check if the error is due to authentication
        if (err.message.includes("Authentication") || err.message.includes("token")) {
          // Redirect to login page
          navigate("/login");
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
      setFetchAttempted(true);
    }
  };

  const handleDeleteProject = async (projectUuid: string) => {
    try {
      await deleteProject(projectUuid);
      // Update the UI by filtering out the deleted project
      setProjects(projects.filter(project => project.uuid !== projectUuid));
      showToast("Project deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting project:", error);
      setError("Failed to delete project");
      showToast("Failed to delete project", "error");
    }
  };

  useEffect(() => {
    // Only fetch projects if authenticated and not already loading
    if (isAuthenticated && !authLoading && !fetchAttempted) {
      getProjects();
    } else if (!isAuthenticated && !authLoading) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, fetchAttempted, navigate]);

  if (authLoading || loading) {
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

  return (
    <div className="space-y-6">
      {/* Projects list */}
      <ProjectsList projects={projects} onDeleteProject={handleDeleteProject} />
    </div>
  );
};

export default Projects;
