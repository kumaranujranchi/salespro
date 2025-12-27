-- Function to notify all active users when an announcement is published
CREATE OR REPLACE FUNCTION public.notify_users_of_announcement()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Only proceed if the announcement is published and (it's a new record OR it was previously unpublished)
    IF (NEW.is_published = true) AND (TG_OP = 'INSERT' OR OLD.is_published = false) THEN
        
        -- Iterate through all active users in the same tenant as the announcement
        FOR user_record IN 
            SELECT p.id, p.tenant_id 
            FROM public.profiles p
            INNER JOIN public.announcements a ON a.tenant_id = p.tenant_id
            WHERE p.is_active = true 
            AND a.id = NEW.id
        LOOP
            
            INSERT INTO public.notifications (
                user_id,
                tenant_id,
                title,
                message,
                type,
                related_entity_type,
                related_entity_id,
                is_read
            ) VALUES (
                user_record.id,
                user_record.tenant_id,
                'New Announcement: ' || NEW.title,
                NEW.content, -- You might want to truncate this if it's too long, generally handled by UI
                'info',
                'announcement',
                NEW.id,
                false
            );
            
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_announcement_published ON public.announcements;

CREATE TRIGGER on_announcement_published
    AFTER INSERT OR UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_users_of_announcement();
