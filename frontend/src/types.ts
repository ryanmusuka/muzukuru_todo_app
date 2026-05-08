// Credentials for Registration and Login
export interface UserCredentials {
  username: string;
  password?: string; 
}

// Expected response from POST /register and POST /login
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Expected response from GET /protected verification
export interface ProtectedResponse {
  message: string;
  user?: string;   
  status: 'success' | 'error';
}

// Basic To-Do Item structure for the protected route
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  owner_id: number;
}

export type FilterType = 'all' | 'todo' | 'completed';
export interface FilterPill {
  id: FilterType;
  label: string;
  color: string;
}

