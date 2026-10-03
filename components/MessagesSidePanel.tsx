'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '@/types';
import {
  MessageSquare,
  Send,
  Search,
  X,
  CheckCheck,
  Paperclip,
  ShieldCheck,
  ChevronLeft,
  Circle,
  Sparkles,
} from 'lucide-react';

export interface ChatContact {
  id: string;
  name: string;
  handle: string;
  role: 'Faculty' | 'Student' | 'Club Lead' | 'Academic Admin';
  department: string;
  avatarBg: string;
  isOnline: boolean;
  lastSeen?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  contactId: string;
  sender: 'user' | 'contact';
  text: string;
  timestamp: string;
  attachmentName?: string;
  attachmentType?: 'pdf' | 'image' | 'doc';
}

interface MessagesSidePanelProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  isEmbeddedView?: boolean;
}

const INITIAL_CONTACTS: ChatContact[] = [
  {
    id: 'c1',
    name: 'Dr. Vikram Raman',
    handle: 'u/v_raman',
    role: 'Faculty',
    department: 'AI & Data Science',
    avatarBg: 'bg-amber-500/10 text-amber-600 border-amber-300',
    isOnline: true,
    unreadCount: 2,
  },
  {
    id: 'c2',
    name: 'Ananya Sharma',
    handle: 'u/ananya_s',
    role: 'Student',
    department: 'Computer Science',
    avatarBg: 'bg-[#FF6848]/10 text-[#FF6848] border-[#FF6848]/30',
    isOnline: true,
    unreadCount: 1,
  },
  {
    id: 'c3',
    name: 'Kavya Patel',
    handle: 'u/kavya_p',
    role: 'Club Lead',
    department: 'Robotics Club',
    avatarBg: 'bg-purple-500/10 text-purple-600 border-purple-300',
    isOnline: false,
    lastSeen: '12m ago',
    unreadCount: 0,
  },
  {
    id: 'c4',
    name: 'Prof. S. Mehta',
    handle: 'u/s_mehta',
    role: 'Academic Admin',
    department: 'Dean Office',
    avatarBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-300',
    isOnline: false,
    lastSeen: '1h ago',
    unreadCount: 0,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  c1: [
    {
      id: 'm1',
      contactId: 'c1',
      sender: 'contact',
      text: 'Hello! Please review the syllabus draft for the upcoming AI & Machine Learning workshop next week.',
      timestamp: '10:15 AM',
      attachmentName: 'AI_Workshop_Syllabus_v2.pdf',
      attachmentType: 'pdf',
    },
    {
      id: 'm2',
      contactId: 'c1',
      sender: 'contact',
      text: 'Let me know if you need any hardware resources from Lab 302.',
      timestamp: '10:16 AM',
    },
  ],
  c2: [
    {
      id: 'm3',
      contactId: 'c2',
      sender: 'contact',
      text: 'Hey! Are you attending the Campus Fest organizing committee meeting today at 4 PM?',
      timestamp: '09:30 AM',
    },
  ],
  c3: [
    {
      id: 'm4',
      contactId: 'c3',
      sender: 'contact',
      text: 'Teensy 4.1 boards and LiDAR sensors have arrived in the Robotics Lab. You can pick up your kit!',
      timestamp: 'Yesterday',
    },
    {
      id: 'm5',
      contactId: 'c3',
      sender: 'user',
      text: 'Awesome! I will swing by during the afternoon break.',
      timestamp: 'Yesterday',
    },
  ],
  c4: [
    {
      id: 'm6',
      contactId: 'c4',
      sender: 'contact',
      text: 'Official circular regarding End-Sem Examination schedule has been released on the Notices Hub.',
      timestamp: 'Oct 01',
    },
  ],
};

export default function MessagesSidePanel({
  isOpen,
  onClose,
  isEmbeddedView = false,
}: MessagesSidePanelProps) {
  const [contacts, setContacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [activeContactId, setActiveContactId] = useState<string>('c1');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileActiveThread, setMobileActiveThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeContact = contacts.find((c) => c.id === activeContactId) || contacts[0];
  const activeMessages = messages[activeContactId] || [];

  // Auto-scroll to bottom of thread when activeMessages length updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const handleSelectContact = (id: string) => {
    setActiveContactId(id);
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
    setMobileActiveThread(true);
  };

  const handleSendMessage = (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content) return;

    const currentTimestamp = new Date();
    const timeString = currentTimestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newMessage: ChatMessage = {
      id: `msg-${currentTimestamp.getTime()}`,
      contactId: activeContactId,
      sender: 'user',
      text: content,
      timestamp: timeString,
    };

    setMessages((prev) => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), newMessage],
    }));

    setInputText('');

    // Simulated auto-reply
    setTimeout(() => {
      const replyDate = new Date();
      const replyTime = replyDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const replies = [
        `Thanks for updating me! I've logged this in the ${activeContact.department} notes.`,
        `Got it! Let's touch base after class.`,
        `Thank you for reaching out. I will review this shortly!`,
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];

      const autoReply: ChatMessage = {
        id: `reply-${replyDate.getTime()}`,
        contactId: activeContactId,
        sender: 'contact',
        text: randomReply,
        timestamp: replyTime,
      };

      setMessages((prev) => ({
        ...prev,
        [activeContactId]: [...(prev[activeContactId] || []), autoReply],
      }));
    }, 1500);
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen && !isEmbeddedView) return null;

  const containerClasses = isEmbeddedView
    ? 'w-full bg-surface border border-subtle rounded-2xl shadow-sm overflow-hidden h-[82vh] flex flex-col md:flex-row'
    : 'fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] md:w-[480px] bg-surface border-l border-subtle shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right';

  return (
    <>
      {/* Overlay Backdrop for Side Drawer */}
      {!isEmbeddedView && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity"
          onClick={onClose}
        />
      )}

      <div className={containerClasses}>
        {/* SIDE PANEL HEADER */}
        <div className="p-4 border-b border-subtle flex items-center justify-between bg-surface-muted/50 shrink-0">
          <div className="flex items-center gap-2.5">
            {mobileActiveThread && (
              <button
                type="button"
                onClick={() => setMobileActiveThread(false)}
                className="md:hidden p-1.5 hover:bg-surface rounded-lg text-muted hover:text-primary transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-[#FF6848]/10 text-[#FF6848] border border-[#FF6848]/20 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-primary tracking-tight flex items-center gap-1.5">
                <span>Campus Messages</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6848]/10 text-[#FF6848] font-bold border border-[#FF6848]/20">
                  Direct
                </span>
              </h3>
              <p className="text-[11px] text-muted font-medium">
                Connect with faculty, peers &amp; club leads
              </p>
            </div>
          </div>

          {!isEmbeddedView && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-surface border border-subtle rounded-lg text-muted hover:text-primary transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* MAIN BODY: CONTACTS LIST + CHAT THREAD */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* LEFT / MOBILE CONTACT LIST */}
          <div
            className={`w-full md:w-5/12 border-r border-subtle flex flex-col bg-surface-muted/30 shrink-0 transition-all ${
              mobileActiveThread ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-subtle">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface border border-subtle rounded-lg focus:border-[#FF6848] outline-none text-primary placeholder:text-muted transition"
                />
              </div>
            </div>

            {/* Contacts Scrollable List */}
            <div className="flex-1 overflow-y-auto divide-y divide-subtle/50">
              {filteredContacts.map((contact) => {
                const isActive = contact.id === activeContactId;
                const contactMsgs = messages[contact.id] || [];
                const lastMsg = contactMsgs[contactMsgs.length - 1];

                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleSelectContact(contact.id)}
                    className={`w-full p-3 text-left transition flex items-start gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-surface border-l-2 border-[#FF6848] font-medium'
                        : 'hover:bg-surface/60'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs ${contact.avatarBg}`}
                      >
                        {contact.name.charAt(0)}
                      </div>
                      {contact.isOnline ? (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-surface" />
                      ) : (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-muted rounded-full ring-2 ring-surface" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-primary truncate">
                          {contact.name}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-muted shrink-0">
                            {lastMsg.timestamp}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-muted mb-1">
                        <span className="px-1.5 py-0.2 rounded bg-surface border border-subtle font-semibold">
                          {contact.role}
                        </span>
                        <span className="truncate">{contact.department}</span>
                      </div>

                      <p className="text-[11px] text-secondary truncate font-normal">
                        {lastMsg ? lastMsg.text : 'No messages yet'}
                      </p>
                    </div>

                    {contact.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#FF6848] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {contact.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT / CHAT THREAD PANEL */}
          <div
            className={`w-full md:w-7/12 flex flex-col bg-surface transition-all ${
              !mobileActiveThread ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Active Contact Header */}
            <div className="p-3 border-b border-subtle bg-surface-muted/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${activeContact.avatarBg}`}
                >
                  {activeContact.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-primary truncate">
                      {activeContact.name}
                    </span>
                    {activeContact.role === 'Faculty' && (
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-muted flex items-center gap-1.5">
                    <span className="flex items-center gap-1">
                      <Circle
                        className={`w-1.5 h-1.5 fill-current ${
                          activeContact.isOnline ? 'text-emerald-500' : 'text-muted'
                        }`}
                      />
                      <span>{activeContact.isOnline ? 'Online' : activeContact.lastSeen || 'Offline'}</span>
                    </span>
                    <span>·</span>
                    <span className="truncate">{activeContact.department}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-surface-muted/10">
              {activeMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-2xs ${
                        isUser
                          ? 'bg-[#FF6848] text-white rounded-tr-none'
                          : 'bg-surface border border-subtle text-primary rounded-tl-none'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                      {/* Attachment indicator if present */}
                      {msg.attachmentName && (
                        <div
                          className={`mt-2 p-2 rounded-xl border flex items-center gap-2 text-[11px] ${
                            isUser
                              ? 'bg-black/10 border-white/20 text-white'
                              : 'bg-surface-muted border-subtle text-primary'
                          }`}
                        >
                          <Paperclip className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate font-mono font-medium">
                            {msg.attachmentName}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted px-1">
                      <span>{msg.timestamp}</span>
                      {isUser && <CheckCheck className="w-3 h-3 text-[#FF6848]" />}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Smart Replies */}
            <div className="px-3 py-1.5 border-t border-subtle bg-surface-muted/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <Sparkles className="w-3 h-3 text-[#FF6848] shrink-0" />
              {[
                'Sounds good!',
                'I will review the notice.',
                'Thanks for the update!',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 bg-surface border border-subtle hover:border-[#FF6848] hover:text-[#FF6848] rounded-full text-[10px] font-medium text-secondary transition whitespace-nowrap cursor-pointer shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-subtle bg-surface shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Message ${activeContact.name.split(' ')[0]}...`}
                    className="w-full pl-3.5 pr-8 py-2 text-xs bg-surface-muted border border-subtle rounded-xl focus:border-[#FF6848] focus:bg-surface outline-none text-primary transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendMessage('📄 Shared attachment notes')}
                    title="Attach file"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="min-h-[36px] px-3.5 bg-[#FF6848] hover:bg-[#FF4500] disabled:opacity-40 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
