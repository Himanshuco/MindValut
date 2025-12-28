import { Button } from '../components/Button';
import { PlusIcon } from '../icons/PlusIcon';
import { ShareIcon } from '../icons/ShareIcon';
import { Card } from '../components/Card';
import { API_URL } from '../config/api';
import { CreateContentModel } from '../components/CreateComponentModel';
import { CreateFolderModal } from '../components/CreateFolderModal';
import { EditModal } from '../components/EditModal';
import { SideBar } from '../components/Sidebar';
import { Notification, useNotification } from '../components/Notification';
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmationDialog';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Content {
  id: string;
  title: string;
  link?: string;
  text?: string;
  type: 'youtube' | 'twitter' | 'text' | 'document' | 'image';
  folderId?: string;
  folder?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface Folder {
  id: string;
  name: string;
  color: string;
  contentCount: number;
}

export function DashBoard() {
  const [modelOpen, setModelOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<'folder' | 'content'>('content');
  const [editData, setEditData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"youtube" | "twitter" | "text" | "document" | "image" | "all" | "folder">("all");
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [foldersUpdateTrigger, setFoldersUpdateTrigger] = useState(0);
  const { notification, showNotification, hideNotification } = useNotification();
  const { dialog, showConfirm, hideConfirm } = useConfirmDialog();
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    
    fetchContents();
    fetchFolders();
    checkShareStatus();
  }, [navigate]);

  const fetchContents = async (folderId?: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      let url = `${API_URL}/api/v1/content`;
      if (folderId !== undefined) {
        url += `?folderId=${folderId === 'null' ? '' : folderId}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setContents(response.data.contents || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching contents:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/signin");
      } else {
        setError("Failed to load content");
      }
    } finally {
      setLoading(false);
    }
  };

  const checkShareStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/v1/brain/share/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.isShared) {
        const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/brain/${response.data.hash}` : `https://mind-valut-fronted.vercel.app/brain/${response.data.hash}`;
        setShareLink(shareUrl);
      }
    } catch (err) {
      console.error("Error checking share status:", err);
    }
  };

  const handleContentAdded = () => {
    if (activeTab === "folder" && activeFolderId) {
      fetchContents(activeFolderId);
    } else if (activeTab === "all") {
      fetchContents();
    } else {
      fetchContents();
    }
    setFoldersUpdateTrigger(prev => prev + 1); // Trigger folder count update
  };

  const handleTabChange = (tab: "youtube" | "twitter" | "text" | "document" | "image" | "all" | "folder", folderId?: string) => {
    setActiveTab(tab);
    if (tab === "folder" && folderId) {
      setActiveFolderId(folderId);
      fetchContents(folderId);
    } else {
      setActiveFolderId(undefined);
      fetchContents();
    }
  };

  const handleCreateFolder = () => {
    setFolderModalOpen(true);
  };

  const handleFolderCreated = () => {
    fetchFolders();
    setFoldersUpdateTrigger(prev => prev + 1);
  };

  const handleDelete = async (contentId: string) => {
    showConfirm(
      'Delete Content',
      'Are you sure you want to delete this content? This action cannot be undone.',
      async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          await axios.delete(`${API_URL}/api/v1/content/${contentId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          // Refresh content list after successful deletion
          fetchContents();
          showNotification('Content deleted successfully', 'success');
        } catch (err: any) {
          console.error("Error deleting content:", err);
          showNotification(err.response?.data?.message || "Failed to delete content", 'error');
        } finally {
          hideConfirm();
        }
      },
      'danger'
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  // Filter contents based on active tab (only for non-folder tabs)
  let filteredContents = contents;
  if (activeTab !== "folder" && activeTab !== "all") {
    if (activeTab === "youtube") {
      filteredContents = contents.filter(content => content.type === "youtube");
    } else {
      filteredContents = contents.filter(content => content.type === activeTab);
    }
  }

  // Get current folder info
  const currentFolder = activeFolderId ? 
    folders.find(f => f.id === activeFolderId) : null;

  // ----------------- EDIT HANDLERS -----------------
  const handleEditContent = (contentId: string, data: any) => {
    setEditType('content');
    setEditData({ id: contentId, ...data });
    setEditModalOpen(true);
  };

  const handleEditFolder = (folderId: string, data: any) => {
    setEditType('folder');
    setEditData({ id: folderId, ...data });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (data: any) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      if (editType === 'content') {
        await axios.put(`${API_URL}/api/v1/content/${data.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
        showNotification('Content updated successfully!', 'success');
        fetchContents();
      } else if (editType === 'folder') {
        await axios.put(`${API_URL}/api/v1/folders/${data.id}`, data, { headers: { Authorization: `Bearer ${token}` } });
        showNotification('Folder updated successfully!', 'success');
        await fetchFolders();
        setFoldersUpdateTrigger(prev => prev + 1); // Trigger sidebar folder update
        // If editing the currently viewed folder, refresh its contents
        if (activeTab === "folder" && activeFolderId === data.id) {
          fetchContents(data.id);
        }
      }
      setEditModalOpen(false);
    } catch (err: any) {
      console.error('Error saving edit:', err);
      showNotification(err.response?.data?.message || 'Error updating', 'error');
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    showConfirm(
      'Delete Folder',
      `Are you sure you want to delete "${folder?.name || 'this folder'}"? All content will be moved to root level.`,
      () => {
        const token = localStorage.getItem("token");
        if (!token) {
          hideConfirm();
          return;
        }
        
        axios.delete(`${API_URL}/api/v1/folders/${folderId}?moveContent=root`, { 
          headers: { Authorization: `Bearer ${token}` } 
        })
        .then(() => {
          hideConfirm();
          showNotification('Folder deleted successfully!', 'success');
          fetchFolders();
          setFoldersUpdateTrigger(prev => prev + 1); // Trigger sidebar folder update
          
          // If the deleted folder was active, switch to all and refresh
          if (activeTab === "folder" && activeFolderId === folderId) {
            setActiveTab("all");
            setActiveFolderId(undefined);
          }
          fetchContents();
        })
        .catch((err: any) => {
          hideConfirm();
          console.error('Error deleting folder:', err);
          showNotification(err.response?.data?.message || 'Error deleting folder', 'error');
        });
      },
      'danger'
    );
  };

  // ----------------- SHARE HANDLER -----------------
  const handleShareToggle = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.post(`${API_URL}/api/v1/brain/share`, {
        share: !shareLink
      }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      });

      if (!shareLink && response.data.hash) {
        // If no link exists, generate new
        const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/brain/${response.data.hash}` : `https://mind-valut-fronted.vercel.app/brain/${response.data.hash}`;
        setShareLink(shareUrl);
      } else {
        // Remove existing link
        setShareLink(null);
      }
    } catch (err) {
      console.error("Error sharing brain:", err);
    }
  };

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`${API_URL}/api/v1/folders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFolders(response.data.folders || []);
    } catch (err) {
      console.error("Error fetching folders:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-800 dark:text-gray-200">Loading your content...</div>
      </div>
    );
  }

  return (
    <>
      <SideBar 
        activeTab={activeTab} 
        activeFolderId={activeFolderId}
        onTabChange={handleTabChange} 
        onCreateFolder={handleCreateFolder}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        foldersUpdateTrigger={foldersUpdateTrigger}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <CreateContentModel
        open={modelOpen}
        onClose={() => setModelOpen(false)}
        onContentAdded={handleContentAdded}
        onNotification={showNotification}
        selectedFolderId={activeTab === "folder" ? activeFolderId : undefined}
      />

      <CreateFolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onFolderCreated={handleFolderCreated}
        onNotification={showNotification}
      />
      
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveEdit}
        type={editType}
        initialData={editData}
        folders={folders}
      />

      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-end p-3 sm:p-4 ml-0 lg:ml-64">
          <Button
            onClick={() => setModelOpen(true)}
            variant="primary"
            text="Add Content"
            startIcon={<PlusIcon />}
          />
          <Button
            onClick={handleShareToggle}
            variant={shareLink ? "success" : "secondary"}
            text={shareLink ? "Unshare" : "Share"}
            startIcon={<ShareIcon />}
          />
          <Button
            onClick={handleLogout}
            variant="secondary"
            text="Logout"
          />
        </div>
      </div>

      {shareLink && (
        <div className="ml-0 lg:ml-64 mx-3 sm:mx-4 mb-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <p className="text-green-800 dark:text-green-200 font-medium text-sm sm:text-base mb-2">Your brain is now shared!</p>
          <div className="flex items-start gap-2">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium flex-shrink-0">Link:</p>
            <a 
              href={shareLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline text-xs sm:text-sm break-all"
            >
              {shareLink}
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="ml-64 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => fetchContents()} 
            className="mt-2 text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Hamburger Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <div className="ml-0 lg:ml-64 p-4 sm:p-6">
        {/* Folder Header */}
        {activeTab === "folder" && currentFolder && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded mr-3 flex-shrink-0"
                style={{ backgroundColor: currentFolder.color }}
              />
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {currentFolder.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {filteredContents.length} items in this folder
                </p>
              </div>
            </div>
          </div>
        )}

        {filteredContents.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
              No content yet
            </h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
              Start building your second brain by adding some content!
            </p>
            <Button
              onClick={() => setModelOpen(true)}
              variant="primary"
              text="Add Your First Content"
              startIcon={<PlusIcon />}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredContents.map((card) => (
              <Card
                key={card.id}
                id={card.id}
                type={card.type}
                link={card.link}
                text={card.text}
                title={card.title}
                onDelete={handleDelete}
                onEdit={handleEditContent}
                canDelete={true}
                canEdit={true}
                onNotification={showNotification}
                folder={card.folder}
              />
            ))}
          </div>
        )}
      </div>
      
      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={hideNotification}
      />
      
      <ConfirmDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm}
        onCancel={hideConfirm}
        type={dialog.type}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}
