import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

/**
 * RealtimeNotifications component
 * Handles realtime notifications for the authenticated user
 * Should be placed in the App component to work globally
 */
const RealtimeNotifications = () => {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        // Get current user
        const getCurrentUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
            }
        };

        getCurrentUser();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
            } else {
                setUserId(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Use the realtime notifications hook
    useRealtimeNotifications(userId);

    // This component doesn't render anything
    return null;
};

export default RealtimeNotifications;

