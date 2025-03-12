export interface ProjectsInterface {
  id: number;
  uuid: string;
  name: string;
  description: string;
  resources: number;
  date_updated: string;
  type?: string;
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