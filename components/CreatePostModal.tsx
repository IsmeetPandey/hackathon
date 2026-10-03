'use client';

import React, { useState, useRef } from 'react';
import { PostItem, UserProfile, PostAttachment } from '@/types';
import ModalShell from '@/components/ui/ModalShell';
import { createPost, uploadPostAttachment } from '@/lib/dbService';
import { PenSquare, Paperclip, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPost: (newPost: PostItem) => void;
  user: UserProfile;
}

const COMMUNITY_OPTIONS = [
  { value: 'Campus Feed', label: 'Campus Feed' },
  { value: 'Robotics Club', label: 'Robotics Club' },
  { value: 'Coding & Algorithms', label: 'Coding & Algorithms' },
  { value: 'Hackathon Commons', label: 'Hackathon Commons' },
  { value: 'Examination Cell', label: 'Examination Cell' },
  { value: 'Career & Placements', label: 'Career & Placements' },
  { value: 'IEEE Student Branch', label: 'IEEE Student Branch' },
];

export default function CreatePostModal({
  isOpen,
  onClose,
  onSubmitPost,
  user,
}: CreatePostModalProps) {
  const [selectedCommunity, setSelectedCommunity] = useState('Campus Feed');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File exceeds the 25MB maximum size limit.');
      return;
    }
    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length < 3) {
      setErrorMessage('Post title must be at least 3 characters.');
      return;
    }

    if (trimmedTitle.length > 300) {
      setErrorMessage('Post title must be under 300 characters.');
      return;
    }

    if (!user.id) {
      setErrorMessage('Please sign in to publish posts.');
      return;
    }

    setIsSubmitting(true);

    try {
      let attachmentData: PostAttachment | undefined = undefined;

      // 1. Upload file to Firebase Storage if selected
      if (selectedFile) {
        setUploadStatus('Uploading attachment to Firebase Storage...');
        try {
          const uploadResult = await uploadPostAttachment(selectedFile, 'posts');
          attachmentData = {
            type: uploadResult.fileType === 'pdf' ? 'pdf' : 'image',
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            imageUrl: uploadResult.fileType === 'image' ? uploadResult.fileUrl : undefined,
            metaText: `Verified Attachment · ${uploadResult.fileSize}`,
            verifiedLabel: 'Uploaded Document',
          };
        } catch (uploadErr: any) {
          throw new Error(`File upload failed: ${uploadErr.message || 'Storage error'}`);
        }
      }

      setUploadStatus('Publishing post to Firestore...');

      // 2. Create post in Firestore
      const newPost = await createPost({
        title: trimmedTitle,
        content: content.trim() || 'No additional text provided.',
        community: selectedCommunity,
        authorId: user.id,
        authorName: user.username || 'Campus Student',
        authorHandle: user.handle,
        authorRole: user.role || 'Student',
        attachment: attachmentData,
      });

      onSubmitPost(newPost);

      // Reset form
      setTitle('');
      setContent('');
      setSelectedFile(null);
      setUploadStatus('');
      setErrorMessage(null);
      onClose();
    } catch (err: any) {
      console.error('Failed to submit post:', err);
      setErrorMessage(err.message || 'An error occurred while publishing your post. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Create a Post"
      subtitle="Share an announcement, project update, or discussion with campus"
      icon={
        <div className="w-8 h-8 rounded-lg bg-brand-surface text-[#FF6848] flex items-center justify-center border border-brand-border">
          <PenSquare className="w-4 h-4" />
        </div>
      }
      maxWidth="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary min-h-[38px] px-4 text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="btn-primary min-h-[38px] px-5 text-xs font-semibold shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{uploadStatus || 'Publishing...'}</span>
              </span>
            ) : (
              <span>Publish Post</span>
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2.5 text-red-500 text-xs leading-relaxed animate-in fade-in font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Community Selector */}
        <div>
          <label className="block text-xs font-bold text-secondary mb-1.5">
            Post To
          </label>
          <select
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            disabled={isSubmitting}
            className="w-full p-2.5 text-xs sm:text-sm border border-subtle rounded-lg bg-surface-muted text-primary font-semibold focus:border-[#FF6848] focus:bg-surface outline-none cursor-pointer disabled:opacity-50"
          >
            {COMMUNITY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value} className="bg-surface text-primary">
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Title */}
        <div>
          <label className="block text-xs font-bold text-secondary mb-1.5">
            Title
          </label>
          <input
            type="text"
            required
            disabled={isSubmitting}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="An informative title for your post..."
            className="w-full p-2.5 text-xs sm:text-sm bg-surface-muted border border-subtle rounded-lg text-primary placeholder:text-muted focus:border-[#FF6848] focus:bg-surface outline-none disabled:opacity-50 font-medium"
          />
        </div>

        {/* 3. Content */}
        <div>
          <label className="block text-xs font-bold text-secondary mb-1.5">
            What&apos;s on your mind?
          </label>
          <textarea
            rows={5}
            disabled={isSubmitting}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share details, context, questions, or updates..."
            className="w-full p-3 text-xs sm:text-sm bg-surface-muted border border-subtle rounded-lg text-primary placeholder:text-muted focus:border-[#FF6848] focus:bg-surface outline-none resize-none disabled:opacity-50 font-medium"
          />
        </div>

        {/* 4. Real Attachment Upload */}
        <div>
          <label className="block text-xs sm:text-[13px] font-bold text-secondary mb-1.5">
            Attach Document or Image (Optional)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.docx,.xlsx,.gcode"
            onChange={handleFileSelect}
          />

          {selectedFile ? (
            <div className="flex items-center justify-between p-3 bg-surface-muted border border-brand-border rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-brand-surface text-[#FF6848] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-muted">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for upload
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isSubmitting}
                className="p-1.5 text-muted hover:text-red-500 rounded-lg transition"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3.5 border border-dashed border-subtle hover:border-[#FF6848] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-secondary hover:text-[#FF6848] transition cursor-pointer bg-surface-muted/50"
            >
              <Paperclip className="w-4 h-4 text-muted" />
              <span>Click to select PDF, Image, or Project file (max 25MB)</span>
            </button>
          )}
        </div>
      </form>
    </ModalShell>
  );
}
