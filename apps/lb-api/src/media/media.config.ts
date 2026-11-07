import { getRequiredEnv } from '../common/get-required-env';

export const MEDIA_CONFIG = Symbol('MEDIA_CONFIG');

export function createMediaConfig() {
  return {
    bucket: getRequiredEnv('PRODUCT_IMAGE_BUCKET'),
    region: getRequiredEnv('AWS_REGION'),
  };
}

export type MediaConfig = ReturnType<typeof createMediaConfig>;
