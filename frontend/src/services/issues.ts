import api from './api';

export interface Issue {
  _id: string;
  title: string;
  description: string;
  category: 'infrastructure' | 'electrical' | 'plumbing' | 'cleaning' | 'security' | 'internet' | 'furniture' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: string;
  images: string[];
  status: 'pending' | 'in-progress' | 'resolved' | 'closed';
  reportedBy: {
    _id: string;
    name: string;
    email: string;
    studentId?: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  upvotes: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  upvoteCount: number;
  resolvedAt?: string;
  resolvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  resolutionNotes?: string;
  estimatedResolutionTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueData {
  title: string;
  description: string;
  category: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  location: string;
  images?: string[];
}

export interface IssueFilters {
  page?: number;
  limit?: number;
  category?: string;
  status?: 'pending' | 'in-progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IssueResponse {
  issues: Issue[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export const issueService = {
  getIssues: async (filters: IssueFilters = {}): Promise<IssueResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/issues?${params.toString()}`);
    return response.data;
  },

  getIssue: async (id: string): Promise<Issue> => {
    const response = await api.get(`/issues/${id}`);
    return response.data;
  },

  createIssue: async (data: CreateIssueData): Promise<Issue> => {
    const response = await api.post('/issues', data);
    return response.data;
  },

  updateIssue: async (id: string, data: Partial<CreateIssueData>): Promise<Issue> => {
    const response = await api.put(`/issues/${id}`, data);
    return response.data;
  },

  upvoteIssue: async (id: string): Promise<Issue> => {
    const response = await api.put(`/issues/${id}/upvote`);
    return response.data;
  },

  assignIssue: async (id: string, assignedTo: string): Promise<Issue> => {
    const response = await api.put(`/issues/${id}/assign`, { assignedTo });
    return response.data;
  },

  updateIssueStatus: async (id: string, status: string, resolutionNotes?: string): Promise<Issue> => {
    const response = await api.put(`/issues/${id}/status`, { status, resolutionNotes });
    return response.data;
  },

  deleteIssue: async (id: string): Promise<void> => {
    await api.delete(`/issues/${id}`);
  },
};
