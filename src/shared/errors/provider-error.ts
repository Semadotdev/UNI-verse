import { AppError } from './app-error';

export class ProviderError extends AppError {
  public readonly providerId: string;

  constructor(message: string, providerId: string, code = 'PROVIDER_ERROR') {
    super(message, code, 502);
    this.name = 'ProviderError';
    this.providerId = providerId;
  }

  static notFound(providerId: string): ProviderError {
    return new ProviderError(
      `Provider '${providerId}' not found`,
      providerId,
      'PROVIDER_NOT_FOUND'
    );
  }

  static disabled(providerId: string): ProviderError {
    return new ProviderError(
      `Provider '${providerId}' is disabled`,
      providerId,
      'PROVIDER_DISABLED'
    );
  }

  static timeout(providerId: string): ProviderError {
    return new ProviderError(
      `Provider '${providerId}' request timed out`,
      providerId,
      'PROVIDER_TIMEOUT'
    );
  }

  static invalidModule(providerId: string, reason: string): ProviderError {
    return new ProviderError(
      `Provider '${providerId}' has invalid module: ${reason}`,
      providerId,
      'PROVIDER_INVALID_MODULE'
    );
  }
}
