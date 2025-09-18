import api from './api';

export interface LostFoundItem {
  _id: string;
  title: string;
  description: string;
  category: 'electronics' | 'clothing' | 'books' | 'accessories' | 'documents' | 'keys' | 'bags' | 'other';
  type: 'lost' | 'found';
  location: string;
  date: string;
  images: string[];
  status: 'active' | 'claimed' | 'closed';
  reportedBy: {
    _id: string;
    name: string;
    email: string;
    studentId?: string;
  };
  claimedBy?: {
    _id: string;
    name: string;
    email: string;
    studentId?: string;
  };
  claimedAt?: string;
  contactInfo: {
    phone: string;
    email: string;
  };
  isVerified: boolean;
  verifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLostFoundData {
  title: string;
  description: string;
  category: string;
  type: 'lost' | 'found';
  location: string;
  date: string;
  images: string[];
  contactInfo: {
    phone: string;
    email: string;
  };
}

export interface LostFoundFilters {
  page?: number;
  limit?: number;
  category?: string;
  type?: 'lost' | 'found';
  status?: 'active' | 'claimed' | 'closed';
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LostFoundResponse {
  items: LostFoundItem[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export const lostFoundService = {
  getItems: async (filters: LostFoundFilters = {}): Promise<LostFoundResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/lost-found?${params.toString()}`);
    return response.data;
  },

  getItem: async (id: string): Promise<LostFoundItem> => {
    const response = await api.get(`/lost-found/${id}`);
    return response.data;
  },

  createItem: async (data: CreateLostFoundData): Promise<LostFoundItem> => {
    const response = await api.post('/lost-found', data);
    return response.data;
  },

  updateItem: async (id: string, data: Partial<CreateLostFoundData>): Promise<LostFoundItem> => {
    const response = await api.put(`/lost-found/${id}`, data);
    return response.data;
  },

  claimItem: async (id: string): Promise<LostFoundItem> => {
    const response = await api.put(`/lost-found/${id}/claim`);
    return response.data;
  },

  verifyItem: async (id: string): Promise<LostFoundItem> => {
    const response = await api.put(`/lost-found/${id}/verify`);
    return response.data;
  },

  closeItem: async (id: string): Promise<LostFoundItem> => {
    const response = await api.put(`/lost-found/${id}/close`);
    return response.data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/lost-found/${id}`);
  },
};
