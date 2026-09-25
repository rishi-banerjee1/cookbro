declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    COOKBRO_INITIAL_PREFERENCES?: string;
    BUCKET?: R2Bucket;
  }
}
