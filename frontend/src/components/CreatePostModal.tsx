'use client';

import { useState, useRef } from 'react';
import { postAPI } from '@/src/lib/api';
import Image from 'next/image';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('media', selectedFile);
      if (caption) formData.append('caption', caption);

      await postAPI.createPost(formData);
      
      onPostCreated();
      resetStateAndClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetStateAndClose = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCaption('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4">
      {/* Close button */}
      <button 
        onClick={resetStateAndClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2"
      >
        <svg aria-label="Close" fill="currentColor" height="18" role="img" viewBox="0 0 24 24" width="18"><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354"></line><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="3.354" y2="20.649"></line></svg>
      </button>

      <div className="bg-white rounded-xl w-full max-w-[850px] aspect-[4/3] flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="h-11 border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
          <div className="w-12">
            {previewUrl && (
              <button 
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); setCaption(''); }}
                className="text-black text-sm p-1 font-semibold"
                disabled={isSubmitting}
              >
                <svg aria-label="Back" fill="currentColor" height="24" viewBox="0 0 24 24" width="24"><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="2.909" x2="22.001" y1="12.004" y2="12.004"></line><polyline fill="none" points="9.276 4.726 2.001 12.004 9.276 19.274" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></polyline></svg>
              </button>
            )}
          </div>
          <h2 className="font-semibold text-base text-black flex-1 text-center">Create new post</h2>
          <div className="w-12 text-right">
            {previewUrl && (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="text-[#0095f6] font-semibold text-sm hover:text-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Sharing...' : 'Share'}
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {!previewUrl ? (
            <div 
              className="flex-1 flex flex-col items-center justify-center p-6"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <svg aria-label="Icon to represent media such as images or videos" className="mb-4 text-black" fill="currentColor" height="77" viewBox="0 0 97.6 77.3" width="96"><path d="M16.3 24h.3c2.8-.2 4.9-2.6 4.8-5.4-.2-2.8-2.6-4.9-5.4-4.8s-4.9 2.6-4.8 5.4c.1 2.7 2.4 4.8 5.1 4.8zm-2.4-7.2c.5-.6 1.3-1 2.1-1h.2c1.7 0 3.1 1.4 3.1 3.1 0 1.7-1.4 3.1-3.1 3.1-1.7 0-3.1-1.4-3.1-3.1 0-.8.3-1.5.8-2.1z" fill="currentColor"></path><path d="M84.7 18.4L58 16.9l-.2-3c-.3-5.7-5.2-10.1-11-9.8L12.9 6c-5.7.3-10.1 5.3-9.8 11L5 51v.8c.7 5.2 5.1 9.1 10.3 9.1h.6l21.7-1.2v.6c-.3 5.7 4 10.7 9.8 11l34 2h.6c5.5 0 10.1-4.3 10.4-9.8l2-34c.4-5.8-4-10.8-9.7-11.1zM7.2 10.8C8.7 9.1 10.8 8.1 13 8l34-1.9c4.6-.3 8.6 3.3 8.9 7.9l.2 2.8-5.3-.3c-5.7-.3-10.7 4-11 9.8l-.6 9.5-9.5 10.7c-.2.3-.6.4-1 .5-.4 0-.7-.1-1-.4l-7.8-7c-1.4-1.3-3.5-1.1-4.8.3L7 49 5.2 17c-.2-2.3.6-4.5 2-6.2zm8.7 48c-4.3.2-8.1-2.8-8.8-7.1l9.4-10.5c.2-.3.6-.4 1-.5.4 0 .7.1 1 .4l7.8 7c.7.6 1.6.9 2.5.9.9 0 1.7-.5 2.3-1.1l7.8-8.8-1.1 18.6-21.9 1.1zm76.5-29.5l-2 34c-.2 4.6-4.3 8.2-8.9 7.9l-34-2c-4.6-.3-8.2-4.3-7.9-8.9l2-34c.2-4.4 3.9-7.9 8.4-7.9h.5l34 2c4.6.3 8.2 4.3 7.9 8.9z" fill="currentColor"></path><path d="M78.2 41.6L61.3 30.5c-2.1-1.4-4.9-.8-6.2 1.3-.4.7-.7 1.4-.7 2.2l-1.2 20.1c-.1 2.5 1.7 4.6 4.2 4.8h.3c2.2 0 4-1.5 4.6-3.6l1.2-4.2 1.2 4.2c.6 2.1 2.5 3.6 4.6 3.6h.3c2.5-.2 4.3-2.3 4.2-4.8l-1.2-20.1c0-.8-.3-1.5-.7-2.2-1.3-2.2-4.1-2.9-6.3-1.5zM66.4 33.2l1.6 11.8h-3.3l1.7-11.8z" fill="currentColor"></path></svg>
              <p className="text-xl font-light mb-6 text-black">Drag photos and videos here</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold rounded-lg px-4 py-1.5 text-sm transition-colors"
              >
                Select from computer
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <>
              {/* Image Preview */}
              <div className="flex-[2] bg-gray-50 flex items-center justify-center relative border-r border-gray-200">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              
              {/* Caption Input */}
              <div className="flex-1 flex flex-col p-4 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <span className="font-semibold text-sm text-black">Current User</span>
                </div>
                <textarea
                  className="w-full flex-1 outline-none resize-none text-black text-sm placeholder-gray-400"
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                />
                <div className="text-right text-xs text-gray-400 mt-2">
                  {caption.length}/2200
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
