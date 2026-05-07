/**
 * Credentials for Registration and Login
 */
export interface UserCredentials {
  username: string;
  password?: string; // Optional for scenarios where only username is needed
}

/**
 * Expected response from POST /register and POST /login
 */
export interface AuthResponse {
  token?: string;    // Provided on successful login
  message?: string;  // General status messages
  error?: string;    // Error message for "Invalid credentials" or failed registration
}

/**
 * Expected response from GET /protected verification
 */
export interface ProtectedResponse {
  message: string;
  user?: string;   
  status: 'success' | 'error';
}

/**
 * Basic To-Do Item structure for the protected route
 */
export interface Todo {
  id: string;
  task: string;
  completed: boolean;
}