const API_URL = 'http://localhost:1337';

export interface ImageData {
  id: number;
  uuid: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  upload_date: string;
  project_id: number;
  user_id: number;
}

export interface Label {
  id: number;
  name: string;
  project_id: number;
}

export interface ProjectsInterface {
  id: number;
  uuid: string;
  name: string;
  description: string;
  resources: number;
  date_updated: string;
  type?: string;
  images?: ImageData[];
}

export const fetchProjects = async (): Promise<Array<ProjectsInterface>> => {
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error("Authentication token is missing");
  }
  
  const response = await fetch("/api/projects", {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed: Invalid or expired token");
    }
    throw new Error("Network response was not ok");
  }
  return await response.json();
};

export const fetchProjectById = async (projectUuid: string): Promise<ProjectsInterface> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token is missing');
  }

  const response = await fetch(`/api/projects/uuid/${projectUuid}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication token is invalid or expired');
    } else if (response.status === 404) {
      throw new Error('Project not found');
    } else {
      throw new Error('Failed to fetch project');
    }
  }

  return await response.json();
};

export interface NewProjectData {
  name: string;
  description: string;
  type?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export const sendAddNewProject = async (data: NewProjectData): Promise<ApiResponse> => {
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error("Authentication token is missing");
  }
  
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed: Invalid or expired token");
    }
    throw new Error('Network response was not ok');
  }

  return response.json();
};

export const deleteProject = async (projectUuid: string): Promise<ApiResponse> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error("Authentication token is missing");
  }
  
  const response = await fetch(`/api/projects/uuid/${projectUuid}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed: Invalid or expired token");
    } else if (response.status === 404) {
      throw new Error("Project not found");
    }
    throw new Error('Failed to delete project');
  }

  return await response.json();
};

export const createProjectLabel = async (projectUuid: string, name: string): Promise<Label> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error("Authentication token is missing");
  }

  const response = await fetch(`${API_URL}/api/projects/${projectUuid}/labels`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error("Failed to create label");
  }

  return response.json();
};