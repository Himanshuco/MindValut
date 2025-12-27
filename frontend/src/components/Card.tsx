import { useEffect, useRef, useState } from "react";
import { ShareIcon } from "../icons/ShareIcon";
import { XIcon } from "../icons/XIcon";
import { EditIcon } from "../icons/EditIcon";

interface CardProps {
  title: string;
  link?: string;
  text?: string;
  type: "twitter" | "youtube" | "text" | "document" | "image";
  id?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, data: any) => void;
  canDelete?: boolean;
  canEdit?: boolean;
  onNotification?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  folder?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export function Card({ title, link, text, type, id, onDelete, onEdit, canDelete = false, canEdit = false, onNotification, folder }: CardProps) {
  const twitterRef = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = useState(false);

  console.log('Card rendered:', { id, title, canEdit, canDelete, hasOnEdit: !!onEdit, hasOnDelete: !!onDelete });

  // Helper function to convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    try {
      let videoId = '';
      
      if (url.includes('youtu.be/')) {
        const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        if (match) {
          videoId = match[1];
        }
      } else if (url.includes('youtube.com/watch')) {
        const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
        if (match) {
          videoId = match[1];
        }
      } else if (url.includes('youtube.com/embed/')) {
        return url;
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (error) {
      console.error('Error parsing YouTube URL:', error);
    }
    
    return url;
  };

  useEffect(() => {
    if (type === "twitter" && (window as any).twttr && twitterRef.current && link) {
      twitterRef.current.innerHTML = '';
      const blockquote = document.createElement("blockquote");
      blockquote.className = "twitter-tweet";
      const anchor = document.createElement("a");
      anchor.href = link.replace("x.com", "twitter.com");
      blockquote.appendChild(anchor);
      twitterRef.current.appendChild(blockquote);

      (window as any).twttr.widgets.load(twitterRef.current);
    }
  }, [type, link]);

  const handleShare = () => {
    if (type === 'text' && text) {
      navigator.clipboard.writeText(text);
      onNotification?.('Text copied to clipboard!', 'success');
    } else if (link) {
      navigator.clipboard.writeText(link);
      onNotification?.('Link copied to clipboard!', 'success');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-5 mb-2 break-words">
              {title}
            </h3>
            {folder && (
              <div className="flex items-center gap-1 mb-1">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{folder.name}</span>
              </div>
            )}
          </div>
          
          {/* Action buttons - always visible for debugging */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 transition-opacity">
            <button
              onClick={handleShare}
              className="p-2 sm:p-2.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Share content"
            >
              <ShareIcon size={16} />
            </button>
            
            {canEdit && id && onEdit && (
              <button
                onClick={() => onEdit(id, { title, link, text, type, folderId: folder?.id })}
                className="p-2 sm:p-2.5 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 rounded-md transition-colors border border-green-300 dark:border-green-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Edit content"
              >
                <EditIcon size={16} />
              </button>
            )}
            
            {canDelete && id && onDelete && (
              <button
                onClick={() => onDelete(id)}
                disabled={deleting}
                className="p-2 sm:p-2.5 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 rounded-md transition-colors disabled:opacity-50 border border-red-300 dark:border-red-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Delete content"
              >
                <XIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-3 sm:p-4">
        {type === "youtube" && link && (
          <div className="w-full">
            <iframe
              className="w-full h-40 sm:h-48 rounded-lg"
              src={getYouTubeEmbedUrl(link)}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {type === "twitter" && link && (
          <div className="w-full">
            <div ref={twitterRef} className="twitter-embed-container"></div>
          </div>
        )}

        {type === "text" && text && (
          <div className="w-full">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <p className="text-gray-700 dark:text-gray-200 text-xs sm:text-sm leading-6 whitespace-pre-wrap break-words">
                {text}
              </p>
            </div>
          </div>
        )}

        {(type === "document" || type === "image") && link && (
          <div className="w-full">
            {type === "image" ? (
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={link} 
                  alt={title}
                  className="w-full h-40 sm:h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextSibling?.remove();
                    const fallback = document.createElement('div');
                    fallback.className = 'w-full h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600';
                    fallback.innerHTML = `
                      <div class="text-center text-gray-500 dark:text-gray-400">
                        <svg class="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p class="text-sm">Image failed to load</p>
                      </div>
                    `;
                    target.parentNode?.appendChild(fallback);
                  }}
                />
              </div>
            ) : (
              <a 
                href={link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors min-h-[44px]"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                      Open Document
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 truncate">
                      {link}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-blue-400 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </a>
            )}
          </div>
        )}

        {/* Fallback for any other type or missing content */}
        {!((type === "youtube" && link) || (type === "twitter" && link) || (type === "text" && text) || ((type === "document" || type === "image") && link)) && (
          <div className="w-full">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">No content available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
