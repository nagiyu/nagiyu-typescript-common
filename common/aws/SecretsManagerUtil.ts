import { SecretsManagerClient, GetSecretValueCommand, GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';
import ErrorUtil from '@common/utils/ErrorUtil';

/**
 * SecretsManagerUtil: static utility class for AWS Secrets Manager operations.
 */
export default class SecretsManagerUtil {
  // Cache for parsed secrets to avoid repeated API calls
  private static secretsCache = new Map<string, Record<string, string>>();

  /**
   * Creates a SecretsManagerClient based on the environment and initLoad flag.
   * @param initLoad If true, always use credentials from environment variables. If false (default), use credentials only if environment is 'local'.
   * @returns {SecretsManagerClient} The configured SecretsManagerClient.
   */
  private static getSecretsManagerClient(initLoad = false): SecretsManagerClient {
    if (initLoad || process.env.PROCESS_ENV === 'local') {
      return new SecretsManagerClient({
        region: process.env.PROJECT_AWS_REGION,
        credentials: {
          accessKeyId: process.env.PROJECT_AWS_ACCESS_KEY!,
          secretAccessKey: process.env.PROJECT_AWS_SECRET_ACCESS_KEY!,
        },
      });
    }
    return new SecretsManagerClient({
      region: process.env.PROJECT_AWS_REGION
    });
  }

  /**
   * Retrieves the value for a specific key from a secret stored as a JSON object in AWS Secrets Manager.
   * @param secretName The name of the secret to retrieve.
   * @param keyName The key within the secret JSON object to retrieve.
   * @param initLoad If true, always use credentials from environment variables. If false (default), use credentials only if environment is 'local'.
   * @throws Throws an error using throwError if retrieval fails, the secret is not found, or the key does not exist.
   * @returns The secret value for the given key as a string.
   */
  public static async getSecretValue(secretName: string, keyName: string, initLoad = false): Promise<string> {
    // Check cache first
    if (this.secretsCache.has(secretName)) {
      const cachedObj = this.secretsCache.get(secretName);
      if (cachedObj && typeof cachedObj === 'object' && keyName in cachedObj) {
        return cachedObj[keyName];
      }
    }

    const input: GetSecretValueCommandInput = {
      SecretId: secretName,
    };

    try {
      const secretsManagerClient = SecretsManagerUtil.getSecretsManagerClient(initLoad);
      const command = new GetSecretValueCommand(input);

      const response = await secretsManagerClient.send(command);

      if (response.SecretString) {
        let parsed: Record<string, string>;
        try {
          parsed = JSON.parse(response.SecretString);
        } catch {
          ErrorUtil.throwError(`Secret string for ${secretName} is not valid JSON.`);
        }

        this.secretsCache.set(secretName, parsed);

        if (keyName in parsed) {
          return parsed[keyName];
        } else {
          ErrorUtil.throwError(`Key '${keyName}' not found in secret: ${secretName}`);
        }
      } else {
        ErrorUtil.throwError(`Secret value not found for secret: ${secretName}`);
      }
    } catch (error) {
      ErrorUtil.throwError(
        `Failed to get secret value for secret: ${secretName}, key: ${keyName}. Error: ${error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
