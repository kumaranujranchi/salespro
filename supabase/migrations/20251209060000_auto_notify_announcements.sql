-- Create a function to automatically generate notifications for all active users when an announcement is posted
CREATE OR REPLACE FUNCTION public.handle_new_announcement()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a notification for every active user
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read)
    SELECT 
        id as user_id,
        'New Announcement: ' || NEW.title as title,
        substring(NEW.content from 1 for 50) || '...' as message,
        'info' as type,
        'announcement' as related_entity_type,
        NEW.id as related_entity_id,
        false as is_read
    FROM public.profiles
    WHERE is_active = true;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function after an announcement is inserted
DROP TRIGGER IF EXISTS on_announcement_created ON public.announcements;
CREATE TRIGGER on_announcement_created
    AFTER INSERT ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_announcement();
