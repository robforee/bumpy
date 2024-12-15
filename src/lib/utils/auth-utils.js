import { getIdToken } from "firebase/auth";
import { auth } from "@/src/lib/firebase/clientApp";

/**
 * Retrieves the ID token for the current user with standardized error handling
 * @returns {Promise<{success: boolean, token?: string, error?: string}>}
 */
export async function getAuthToken() {
  try {
    if (!auth.currentUser) {
      return { success: false, error: "No authenticated user" };
    }
    const token = await getIdToken(auth.currentUser);
    return { success: true, token };
  } catch (error) {
    console.error("Error getting auth token:", error);
    return { 
      success: false, 
      error: error.message || "Failed to get authentication token" 
    };
  }
}

/**
 * Wrapper for server action calls with standardized error handling
 * @param {Function} serverAction - The server action to call
 * @param {Array} args - Arguments to pass to the server action
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function callServerAction(serverAction, ...args) {
  try {
    const tokenResult = await getAuthToken();
    if (!tokenResult.success) {
      return tokenResult;
    }

    const result = await serverAction(tokenResult.token, ...args);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error calling server action:", error);
    return {
      success: false,
      error: error.message || "Failed to complete the operation"
    };
  }
}

/**
 * Custom hook for managing loading and error states in components
 * @returns {Object} Loading and error state management utilities
 */
export function useLoadingState() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const startLoading = () => {
    setIsLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const handleError = (error) => {
    setError(error);
    setIsLoading(false);
  };

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    handleError
  };
}
