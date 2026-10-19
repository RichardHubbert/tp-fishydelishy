import { useAuth } from './useAuth';
import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdminUser(false);
        setIsLoading(false);
        return;
      }

      try {
        // First try the tp_is_admin() RPC function
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('tp_is_admin');

        if (!rpcError && rpcData !== null) {
          setIsAdminUser(rpcData === true);
          setIsLoading(false);
          return;
        }

        // Fallback: check profiles.role directly
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user role:', profileError);
          setIsAdminUser(false);
        } else {
          setIsAdminUser(profileData?.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdminUser(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const isAdmin = useMemo(() => {
    return isAdminUser;
  }, [isAdminUser]);

  return { isAdmin, user, isLoading };
}; 