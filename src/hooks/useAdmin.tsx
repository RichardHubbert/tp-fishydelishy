import { useAuth } from './useAuth';
import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdmin = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      try {
        // Use tp_is_admin RPC to check admin status
        const { data: isAdminResult, error: rpcError } = await supabase
          .rpc('tp_is_admin');

        if (rpcError) {
          console.error('Error checking admin status via RPC:', rpcError);
          // Fallback: read user's own profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

          if (profileError) {
            console.error('Error fetching user profile:', profileError);
            setUserRole(null);
          } else {
            setUserRole(profileData?.role || null);
          }
        } else {
          // RPC succeeded, set role based on result
          setUserRole(isAdminResult ? 'admin' : 'user');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = useMemo(() => {
    if (!user || !userRole) return false;
    return userRole === 'admin';
  }, [user, userRole]);

  return { isAdmin, user, userRole, isLoading };
}; 