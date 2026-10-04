import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/context/WebSocketContext';
import audioChime from '@/utils/audioChime';
import { 
  X, MessageSquare, ArrowRight, Paperclip, 
  Volume2, VolumeX, Sparkles, UserCheck, Users 
} from 'lucide-react';

const MessagePopupItem = ({ popup, onDismiss }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const totalDuration = popup.duration || 6000;
  const remainingTimeRef = useRef(totalDuration);
  const lastTickRef = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    lastTickRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (isPaused) {
        lastTickRef.current = Date.now();
        return;
      }

      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - delta);
      const newPercent = (remainingTimeRef.current / totalDuration) * 100;
      setProgress(newPercent);

      if (remainingTimeRef.current <= 0) {
        clearInterval(timerRef.current);
        onDismiss(popup.id);
      }
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [isPaused, onDismiss, popup.id, totalDuration]);

  const handleAction = () => {
    onDismiss(popup.id);
    if (popup.url) {
      navigate(popup.url);
    } else if (popup.connectionId) {
      navigate(`/connect?chat=${popup.connectionId}`);
    } else {
      navigate('/connect');
    }
  };

  // Badge configuration based on notification type
  const getBadge = () => {
    switch (popup.type) {
      case 'group_message':
        return {
          icon: <Users className="w-3 h-3 text-cyan-400" />,
          label: 'Group Chat',
          badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
        };
      case 'connection_request':
        return {
          icon: <Sparkles className="w-3 h-3 text-amber-400" />,
          label: 'Request',
          badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
        };
      case 'connection_accepted':
        return {
          icon: <UserCheck className="w-3 h-3 text-green-400" />,
          label: 'Connected',
          badgeClass: 'bg-green-500/10 text-green-300 border-green-500/30'
        };
      default:
        return {
          icon: <MessageSquare className="w-3 h-3 text-orange-400" />,
          label: 'Mathmate',
          badgeClass: 'bg-orange-500/10 text-orange-300 border-orange-500/30'
        };
    }
  };

  const badge = getBadge();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.92, x: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, x: 60, scale: 0.85, transition: { duration: 0.22, ease: 'easeOut' } }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="pointer-events-auto w-full bg-slate-900/95 backdrop-blur-xl border border-orange-500/35 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden relative group hover:border-orange-500/60 transition-colors"
      role="alert"
    >
      {/* Top subtle glow highlight */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-amber-400 opacity-80" />

      <div className="p-3.5 sm:p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 via-amber-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-orange-500/20">
                {popup.avatarLetter || 'M'}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            {/* Sender & Badge */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-white text-sm font-semibold truncate leading-tight">
                  {popup.title}
                </h4>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${badge.badgeClass}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                {popup.subtitle || 'Just now'}
              </p>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => onDismiss(popup.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors flex-shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="mt-2.5 pl-12 pr-1">
          <p className="text-slate-200 text-xs sm:text-sm line-clamp-2 leading-relaxed break-words font-body">
            {popup.content}
          </p>

          {popup.attachment && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/70 border border-slate-700/60 text-[11px] text-slate-300">
              <Paperclip className="w-3 h-3 text-orange-400" />
              <span className="truncate max-w-[200px]">
                {popup.attachment.original_filename || `${popup.attachment.file_type || 'File'} attachment`}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-3.5 pl-12 flex items-center justify-between gap-2">
          <button
            onClick={handleAction}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs shadow-md shadow-orange-950/40 hover:shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <span>{popup.type === 'connection_request' ? 'View Requests' : 'Reply & Open'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDismiss(popup.id)}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Countdown progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-800/80">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
};

const MessagePopupContainer = () => {
  const { popups, dismissPopup } = useWebSocket();
  const [isMuted, setIsMuted] = useState(audioChime.isMuted());

  const toggleSound = () => {
    const nextState = audioChime.toggleMute();
    setIsMuted(nextState);
  };

  if (!popups || popups.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm sm:max-w-md w-[calc(100vw-2rem)]"
      data-testid="message-popup-container"
    >
      {/* Sound toggle hint if multiple popups */}
      {popups.length > 0 && (
        <div className="self-end pointer-events-auto mb-1">
          <button
            onClick={toggleSound}
            title={isMuted ? 'Notification sound muted (click to unmute)' : 'Notification sound active (click to mute)'}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[10px] text-slate-400 hover:text-white transition-colors backdrop-blur-md shadow-sm"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3 h-3 text-red-400" />
                <span>Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3 text-emerald-400" />
                <span>Sound On</span>
              </>
            )}
          </button>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {popups.map(popup => (
          <MessagePopupItem 
            key={popup.id} 
            popup={popup} 
            onDismiss={dismissPopup} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MessagePopupContainer;
