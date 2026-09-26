declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    COOKBRO_AUTH_MODE?: 'sites'|'device-link';
    COOKBRO_OWNER_EMAIL?: string;
    COOKBRO_INITIAL_PREFERENCES?: string;
    BUCKET?: R2Bucket;
  }
}
