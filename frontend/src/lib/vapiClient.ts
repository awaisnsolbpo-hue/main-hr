import Vapi from "@vapi-ai/web";
import { vapiApi } from "@/services/api";

let cachedPublicKey: string | null = null;

export const createVapiClient = async () => {
  // Fetch public key from backend
  if (!cachedPublicKey) {
    try {
      const config = await vapiApi.getConfig();
      if (config?.publicKey) {
        cachedPublicKey = config.publicKey;
        console.log('✅ VAPI public key loaded from backend');
      } else {
        // Backend returned null - use fallback
        throw new Error('VAPI public key not configured in backend');
      }
    } catch (error: any) {
      // Silently fallback to env variable if backend fails
      // This is expected if VAPI_PUBLIC_KEY is not set in backend
      console.warn('⚠️ VAPI config not available from backend, using fallback:', error?.message || 'Unknown error');
      
      const fallbackKey = (import.meta as any).env?.VITE_VAPI_PUBLIC_KEY;
      if (fallbackKey) {
        cachedPublicKey = fallbackKey;
        console.log('✅ VAPI public key loaded from environment variable');
      } else {
        // Last resort fallback (should not be used in production)
        cachedPublicKey = "b20ebfed-ff48-43f9-a287-84b64f553d14";
        console.warn('⚠️ VAPI public key using hardcoded fallback (not recommended for production)');
      }
    }
  }
  
  if (!cachedPublicKey) {
    throw new Error('VAPI public key is not available. Please check backend configuration.');
  }
  
  // Log partial key for debugging (first 8 and last 4 chars only)
  const keyPreview = cachedPublicKey.length > 12 
    ? `${cachedPublicKey.substring(0, 8)}...${cachedPublicKey.substring(cachedPublicKey.length - 4)}`
    : '***';
  console.log('🔑 Using VAPI public key:', keyPreview);
  
  try {
    const client = new Vapi(cachedPublicKey);
    console.log('✅ VAPI client created successfully');
    return client;
  } catch (error: any) {
    console.error('❌ Failed to create VAPI client:', error);
    console.error('❌ Error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });
    throw new Error(`Failed to initialize VAPI client: ${error.message || 'Unknown error'}`);
  }
};

export interface VapiSessionContext {
  candidate_name: string;
  candidate_email: string;
  client_questions: string;
  ai_generated_questions: string;
}

