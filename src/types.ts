export type UserRole = 'client' | 'provider' | 'admin';
export type UserStatus = 'pending' | 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  photoURL?: string;
  category?: string;
  bio?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  hourlyRate?: number;
  status: UserStatus;
  address?: {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  createdAt: any;
  planExpiresAt?: any;
}

export interface Review {
  id?: string;
  providerId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface PaymentRequest {
  id?: string;
  providerId: string;
  amount: number;
  status: 'pending' | 'verified';
  receiptUrl?: string;
  createdAt: any;
}
