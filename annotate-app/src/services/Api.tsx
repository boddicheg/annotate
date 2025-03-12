export interface ProjectsInterface {
  id: number;
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