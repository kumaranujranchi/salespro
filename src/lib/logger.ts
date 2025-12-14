import { supabase } from './supabase';

export const logActivity = async (action: string, details: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('activity_logs').insert([
            {
                user_id: user.id,
                action,
                details,
            },
        ]);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};
