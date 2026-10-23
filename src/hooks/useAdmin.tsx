import { useAuth } from './useAuth';
import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdmin = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsAdminUser(false);
      setCheckedUserId(null);
      return;
    }

    let cancelled = false;

    const checkAdminStatus = async () => {
      try {
        // Use the tp_is_admin() RPC function which safely checks admin status
        const { data, error } = await supabase.rpc('tp_is_admin');
        if (cancelled) return;

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdminUser(false);
        } else {
          setIsAdminUser(data === true);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error checking admin status:', error);
        setIsAdminUser(false);
      } finally {
        if (!cancelled) setCheckedUserId(userId);
      }
    };

    checkAdminStatus();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const isLoading = Boolean(userId) && checkedUserId !== userId;

  const isAdmin = useMemo(() => {
    return Boolean(userId) && isAdminUser && checkedUserId === userId;
  }, [userId, isAdminUser, checkedUserId]);

  return { isAdmin, user, userRole: isAdmin ? 'admin' : 'user', isLoading };
}; 