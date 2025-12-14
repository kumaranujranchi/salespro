import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useDialog } from '../contexts/DialogContext';
import { Announcement } from '../types/database';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Megaphone, Plus, Trash2, Pencil } from 'lucide-react';

export function AnnouncementsPage() {
  const { user, profile } = useAuth();
  const dialog = useDialog();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isImportant: false,
    isPublished: true
  });

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      isImportant: false,
      isPublished: true
    });
    setEditingAnnouncementId(null);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncementId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      isImportant: announcement.is_important || false,
      isPublished: announcement.is_published || false
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isAdmin) {
      await dialog.alert('You do not have permission to perform this action.', { variant: 'danger' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAnnouncementId) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update({
            title: formData.title,
            content: formData.content,
            is_important: formData.isImportant,
            is_published: formData.isPublished
          })
          .eq('id', editingAnnouncementId);

        if (error) throw error;
        await dialog.alert('Announcement updated successfully!', { variant: 'success', title: 'Success' });
      } else {
        // Create new announcement
        const { error } = await supabase.from('announcements').insert({
          title: formData.title,
          content: formData.content,
          is_important: formData.isImportant,
          is_published: formData.isPublished,
          created_by: user.id
        });

        if (error) throw error;
        await dialog.alert('Announcement created successfully!', { variant: 'success', title: 'Success' });
      }

      handleCloseModal();
      loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      await dialog.alert('Failed to save announcement', { variant: 'danger', title: 'Error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;

    const confirmed = await dialog.confirm('Are you sure you want to delete this announcement?', {
      variant: 'danger',
      confirmText: 'Delete',
      title: 'Delete Announcement'
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      loadAnnouncements();
      await dialog.alert('Announcement deleted.', { variant: 'success', title: 'Deleted' });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      await dialog.alert('Failed to delete announcement.', { variant: 'danger', title: 'Error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2">Announcements</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Company-wide announcements and updates</p>
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={() => { resetForm(); setIsModalOpen(true); }} className="hidden md:flex">
            <Plus size={18} className="mr-2" />
            New Announcement
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#1673FF] border-t-transparent"></div>
          </div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-gray-500 text-center py-8">No announcements yet</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{announcement.title}</h3>
                      {announcement.is_important && (
                        <Badge variant="danger">Important</Badge>
                      )}
                      {!announcement.is_published && (
                        <Badge variant="default">Draft</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Megaphone className="text-gray-400" size={20} />
                      <Button variant="ghost" size="sm" onClick={() => handleEditAnnouncement(announcement)}>
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                  {!isAdmin && <Megaphone className="text-gray-400" size={20} />}
                </div>
                <div className="mt-3 md:mt-4 text-sm md:text-base text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words overflow-hidden">
                  {announcement.content}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      {isAdmin && (
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="md:hidden fixed bottom-24 right-4 w-12 h-12 bg-[#1673FF] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 active:scale-95 transition-all z-30"
        >
          <Plus size={24} />
        </button>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAnnouncementId ? "Edit Announcement" : "Create Announcement"}
      >
        <form onSubmit={handleSaveAnnouncement} className="space-y-6">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
            placeholder="Announcement Title"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-800 dark:text-gray-200">
              Content
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1673FF] focus:border-transparent min-h-[120px] dark:bg-white/5 dark:text-white dark:placeholder-gray-500"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              required
              placeholder="Write your announcement content here..."
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isImportant}
                onChange={(e) => setFormData(prev => ({ ...prev, isImportant: e.target.checked }))}
                className="w-4 h-4 text-[#1673FF] rounded border-gray-300 focus:ring-[#1673FF]"
              />
              <span className="text-sm text-gray-700">Mark as Important</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                className="w-4 h-4 text-[#1673FF] rounded border-gray-300 focus:ring-[#1673FF]"
              />
              <span className="text-sm text-gray-700">Publish Immediately</span>
            </label>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {editingAnnouncementId ? (
                <>
                  <span className="hidden md:inline">Update Announcement</span>
                  <span className="md:hidden">Update</span>
                </>
              ) : (
                <>
                  <span className="hidden md:inline">Post Announcement</span>
                  <span className="md:hidden">Post</span>
                </>
              )}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div >
  );
}
