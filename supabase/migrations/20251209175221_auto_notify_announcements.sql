/*
  # Auto-Notify Users on New Announcements

  1. New Function:
     - `handle_new_announcement()` - Automatically creates notifications for all active users when an announcement is posted
  
  2. Details:
     - Notification includes announcement title prefixed with "New Announcement: "
     - Message contains first 50 characters of announcement content
     - Only active users (is_active = true) receive notifications
     - Notifications are marked as unread by default
     - Links notification to the announcement via related_entity_id
  
  3. Trigger:
     - `on_announcement_created` - Fires AFTER INSERT on announcements table
     - Automatically invokes the notification function for each new announcement
  
  4. Security:
     - Function uses SECURITY DEFINER to ensure it can insert notifications regardless of RLS
     - Inherits existing RLS policies on notifications table for read access
*/

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
