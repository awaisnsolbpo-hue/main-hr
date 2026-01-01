// Gmail OAuth Authentication Library
import { supabase } from "@/integrations/supabase/client";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// SECURITY: Client secrets must NEVER be in frontend code
// Token exchange is now handled by backend API

// OAuth scopes needed for Gmail API
const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
].join(" ");

/**
 * Initiates Gmail OAuth flow
 * Redirects user to Google login page
 */
export const initiateGmailOAuth = () => {
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem("gmail_oauth_state", state);

    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: SCOPES,
        state: state,
        access_type: "offline",
        prompt: "consent",
    });

    window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

/**
 * Exchanges authorization code for access token via backend API
 * SECURITY: Token exchange must happen on backend with client secret
 */
export const exchangeCodeForToken = async (code: string) => {
    if (!API_BASE_URL) {
        throw new Error("API_BASE_URL is not configured");
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error("User not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/oauth/google/exchange`, {
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
        const error = await response.text();
        throw new Error(`Failed to exchange code: ${error}`);
    }

    return response.json();
};

/**
 * Saves Gmail tokens to user profile
 */
export const saveGmailTokens = async (tokens: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
}) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

    const { error } = await supabase
        .from("profiles")
        .update({
            gmail_access_token: tokens.access_token,
            gmail_refresh_token: tokens.refresh_token || null,
            gmail_token_expires_at: expiresAt.toISOString(),
            gmail_connected_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (error) {
        throw new Error(`Failed to save tokens: ${error.message}`);
    }
};

/**
 * Checks if Gmail is connected for current user
 */
export const isGmailConnected = async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("gmail_access_token, gmail_token_expires_at")
        .eq("id", user.id)
        .single();

    if (!profile?.gmail_access_token) {
        return false;
    }

    // Check if token is expired
    if (profile.gmail_token_expires_at) {
        const expiresAt = new Date(profile.gmail_token_expires_at);
        if (expiresAt < new Date()) {
            return false; // Token expired
        }
    }

    return true;
};

/**
 * Gets valid Gmail access token (refreshes if needed)
 */
export const getGmailAccessToken = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("gmail_access_token, gmail_refresh_token, gmail_token_expires_at")
        .eq("id", user.id)
        .single();

    if (!profile?.gmail_access_token) {
        throw new Error("Gmail not connected");
    }

    // Check if token needs refresh
    if (profile.gmail_token_expires_at) {
        const expiresAt = new Date(profile.gmail_token_expires_at);
        const now = new Date();
        const fiveMinutes = 5 * 60 * 1000;

        // Refresh if token expires in less than 5 minutes
        if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
            if (!profile.gmail_refresh_token) {
                throw new Error("No refresh token available");
            }

            if (!API_BASE_URL) {
                throw new Error("API_BASE_URL is not configured");
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("User not authenticated");
            }

            // Refresh the token via backend API
            const response = await fetch(`${API_BASE_URL}/oauth/google/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    refresh_token: profile.gmail_refresh_token,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to refresh token");
            }

            const tokens = await response.json();
            await saveGmailTokens({
                access_token: tokens.access_token,
                refresh_token: profile.gmail_refresh_token,
                expires_in: tokens.expires_in,
            });

            return tokens.access_token;
        }
    }

    return profile.gmail_access_token;
};

/**
 * Disconnects Gmail (removes tokens)
 */
export const disconnectGmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            gmail_access_token: null,
            gmail_refresh_token: null,
            gmail_token_expires_at: null,
            gmail_connected_at: null,
        })
        .eq("id", user.id);

    if (error) {
        throw new Error(`Failed to disconnect: ${error.message}`);
    }
};