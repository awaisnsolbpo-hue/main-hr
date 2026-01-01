// src/lib/linkedinAuth.ts
// LinkedIn OAuth Authentication Library

import { supabase } from "@/integrations/supabase/client";

const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_LINKEDIN_REDIRECT_URI || "http://localhost:8080/auth/linkedin/callback";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";

// SECURITY: Client secrets must NEVER be in frontend code
// Token exchange is now handled by backend API

// Updated scopes for company page access
const SCOPES = [
  "openid",
  "profile", 
  "email",
  "w_member_social",
  "w_organization_social",
  "r_organization_social",
  "rw_organization_admin"
].join(" ");

export interface LinkedInTokens {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

/**
 * Initiate LinkedIn OAuth flow
 */
export const initiateLinkedInOAuth = async (): Promise<void> => {
  try {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated. Please log in first.");
    }

    // Generate a random state for CSRF protection
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem("linkedin_oauth_state", state);

    // Build OAuth URL
    const params = new URLSearchParams({
      response_type: "code",
      client_id: LINKEDIN_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      state: state,
      scope: SCOPES,
    });

    const authUrl = `${LINKEDIN_AUTH_URL}?${params.toString()}`;
    
    // Redirect to LinkedIn
    window.location.href = authUrl;
  } catch (error) {
    console.error("Error initiating LinkedIn OAuth:", error);
    throw error;
  }
};

/**
 * Exchange authorization code for access token via backend API
 * SECURITY: Token exchange must happen on backend with client secret
 */
export const exchangeCodeForToken = async (code: string): Promise<LinkedInTokens> => {
  try {
    if (!API_BASE_URL) {
      throw new Error("API_BASE_URL is not configured");
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/oauth/linkedin/exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code: ${response.status} ${errorText}`);
    }

    const tokens: LinkedInTokens = await response.json();
    return tokens;
  } catch (error) {
    throw error;
  }
};

/**
 * Save LinkedIn tokens to Supabase
 */
export const saveLinkedInTokens = async (tokens: LinkedInTokens): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated");
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    const { error } = await supabase
      .from("profiles")
      .update({
        linkedin_access_token: tokens.access_token,
        linkedin_refresh_token: tokens.refresh_token || null,
        linkedin_token_expires_at: expiresAt.toISOString(),
        linkedin_connected: true,
      })
      .eq("id", session.user.id);

    if (error) {
      console.error("Error saving LinkedIn tokens:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in saveLinkedInTokens:", error);
    throw error;
  }
};

/**
 * Get LinkedIn access token for current user
 */
export const getLinkedInAccessToken = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("linkedin_access_token, linkedin_token_expires_at")
      .eq("id", session.user.id)
      .single();

    if (error) throw error;

    if (!data?.linkedin_access_token) {
      return null;
    }

    // Check if token is expired
    if (data.linkedin_token_expires_at) {
      const expiresAt = new Date(data.linkedin_token_expires_at);
      if (expiresAt < new Date()) {
        console.log("LinkedIn token expired");
        return null;
      }
    }

    return data.linkedin_access_token;
  } catch (error) {
    console.error("Error getting LinkedIn access token:", error);
    return null;
  }
};

/**
 * Check if LinkedIn is connected
 */
export const isLinkedInConnected = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { data, error } = await supabase
      .from("profiles")
      .select("linkedin_connected, linkedin_token_expires_at")
      .eq("id", session.user.id)
      .single();

    if (error) return false;

    if (!data?.linkedin_connected) return false;

    // Check token expiry
    if (data.linkedin_token_expires_at) {
      const expiresAt = new Date(data.linkedin_token_expires_at);
      if (expiresAt < new Date()) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking LinkedIn connection:", error);
    return false;
  }
};

/**
 * Disconnect LinkedIn
 */
export const disconnectLinkedIn = async (): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        linkedin_access_token: null,
        linkedin_refresh_token: null,
        linkedin_token_expires_at: null,
        linkedin_connected: false,
      })
      .eq("id", session.user.id);

    if (error) throw error;
  } catch (error) {
    console.error("Error disconnecting LinkedIn:", error);
    throw error;
  }
};