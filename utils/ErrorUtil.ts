/**
 * Utility for handling errors in the application.
 */
export default class ErrorUtil {
  /**
   * Throws an error with the provided message and error details.
   * @param message The error message to throw.
   * @param error The error details to include.
   * @throws Throws an Error with the specified message and error details.
   */
  public static throwError(message?: string | null, error?: any | null): never {
    if (!message && !error) {
      const msg = 'An unknown error occurred';
      console.error(msg);
      throw new Error(msg);
    }

    if (!message) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(msg);
      throw error instanceof Error ? error : new Error(msg);
    }

    if (!error) {
      console.error(message);
      throw new Error(message);
    }

    const combinedMessage = `${message}: ${error instanceof Error ? error.message : String(error)}`;
    console.error(combinedMessage);
    throw new Error(combinedMessage);
  }
}
