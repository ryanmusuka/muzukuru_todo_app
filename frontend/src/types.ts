// Credentials for Registration and Login
export interface UserCredentials {
  username: string;
  password?: string; 
}

// Expected response from POST /register and POST /login
export interface AuthResponse {
  token?: string;    
  message?: string;  
  error?: string;   
}

// Expected response from GET /protected verification
export interface ProtectedResponse {
  message: string;
  user?: string;   
  status: 'success' | 'error';
}

// Basic To-Do Item structure for the protected route
export interface Todo {
  id: string;
  task: string;
  completed: boolean;
}