import type { IStorageAdapter, StorageConfig, StorageProviderType } from './types';
import { LocalStorageAdapter } from './adapters/local';
import { BackblazeB2Adapter } from './adapters/b2';

export * from './types';
export { LocalStorageAdapter } from './adapters/local';
export { BackblazeB2Adapter } from './adapters/b2';

let defaultStorageInstance: IStorageAdapter | null = null;

export function getStorageAdapter(customConfig?: StorageConfig): IStorageAdapter {
  if (customConfig) {
    return createAdapter(customConfig.provider, customConfig);
  }

  if (defaultStorageInstance) {
    return defaultStorageInstance;
  }

  const requestedProvider = (process.env.STORAGE_PROVIDER || '').toLowerCase() as StorageProviderType;
  const hasB2Credentials = Boolean(
    (process.env.B2_KEY_ID || process.env.AWS_ACCESS_KEY_ID) &&
    (process.env.B2_APPLICATION_KEY || process.env.AWS_SECRET_ACCESS_KEY)
  );

  let provider: StorageProviderType = 'local';

  if (requestedProvider === 'b2' || requestedProvider === 's3' || requestedProvider === 'r2') {
    provider = hasB2Credentials ? 'b2' : 'local';
  } else if (hasB2Credentials && requestedProvider !== 'local') {
    provider = 'b2';
  }

  defaultStorageInstance = createAdapter(provider);
  return defaultStorageInstance;
}

function createAdapter(provider: StorageProviderType, config?: StorageConfig): IStorageAdapter {
  switch (provider) {
    case 'b2':
    case 's3':
    case 'r2':
      return new BackblazeB2Adapter(config);
    case 'local':
    default:
      return new LocalStorageAdapter(config?.localStoragePath, process.env.STORAGE_SIGN_SECRET);
  }
}
