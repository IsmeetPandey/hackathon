'use client';

import React, { useState } from 'react';
import { PostItem, UserProfile } from '@/types';
import { DEMO_MODE } from '@/lib/mockData';
import ModalShell from '@/components/ui/ModalShell';
import { PenSquare, Paperclip, Loader2, AlertCircle } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPost: (newPost: PostItem) => void;
  user: UserProfile;
}

const COMMUNITY_OPTIONS = [
  { value: 'all-campus', label: 'Campus Feed' },
  { value: 'RoboticsClub', label: 'Robotics Club' },
  { value: 'coding_algorithms', label: 'Coding & Algorithms' },
  { value: 'examination_cell', label: 'Examination Cell' },
  { value: 'placement_office', label: 'Career & Placements' },
  { value: 'hackathon_teams', label: 'Hackathon Commons' },
];

export default function CreatePostModal({
  isOpen,
  onClose,
  onSubmitPost,
  user,
}: CreatePostModalProps) {
  const [selectedCommunity, setSelectedCommunity] = useState('all-campus');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

    setIsSubmitting(true);

    try {
      const payload = {
        title: trimmedTitle,
        content: content.trim() || 'No additional text provided.',
        community: selectedCommunity,
        author: user.username || (user.handle ? user.handle.replace(/^u\//, '') : 'Ananya Sharma'),
        authorRole: user.role || 'Student',
        attachment: attachmentName.trim()
          ? {
              type: attachmentName.endsWith('.pdf') ? 'pdf' : 'image',
              fileName: attachmentName.trim(),
              metaText: DEMO_MODE ? 'Attached Campus Document (Demo)' : 'Attached Campus Document',
            }
          : undefined,
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server rejected post submission.');
      }

      if (!data.post) {
        throw new Error('Server returned invalid post data.');
      }

      onSubmitPost(data.post);

      // Reset on success
      setTitle('');
      setContent('');
      setAttachmentName('');
      setErrorMessage(null);
      onClose();
    } catch (err: any) {
      console.error('Failed to submit post:', err);
      setErrorMessage(err.message || 'An error occurred while publishing your post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Create a Post"
      subtitle="Share an announcement, project update, or discussion with campus"
      icon={
        <div className="w-8 h-8 rounded-lg bg-[#FFF4EE] text-[#FF4500] flex items-center justify-center">
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
            className="btn-secondary min-h-[38px] px-4 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="btn-primary min-h-[38px] px-5 text-xs font-semibold shadow-2xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
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

        {/* 1. Community Selector (Human-readable without raw slugs) */}
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

        {/* 3. Content (Visual center) */}
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

        {/* 4. Optional Attachment */}
        <div>
          <label className="block text-xs sm:text-[13px] font-bold text-secondary mb-1.5">
            Attach Document (Optional)
          </label>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setAttachmentName(file.name);
              }
            }}
          />
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Paperclip className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                disabled={isSubmitting}
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Attach document name or select file..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-surface-muted border border-subtle rounded-lg text-primary placeholder:text-muted focus:border-[#FF6848] focus:bg-surface outline-none"
              />
            </div>
            {attachmentName ? (
              <button
                type="button"
                onClick={() => setAttachmentName('')}
                className="px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition shrink-0 cursor-pointer"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary px-3.5 py-2 text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <Paperclip className="w-3.5 h-3.5 text-muted" />
                <span>Attach file</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
