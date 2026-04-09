export interface BackendApiFoundationProps {
  /**
   * API name visible in API Gateway.
   * @default TapliveBackendApi
   */
  readonly apiName?: string;

  /**
   * Allowed origins for CORS.
   * @default ['*']
   */
  readonly corsAllowedOrigins?: string[];
}
