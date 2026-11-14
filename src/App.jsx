/**
 * ============================================================================
 * FILE FRONTEND: src/App.jsx
 * TACTICAL VIDCOMM DISKOMLEKAU — 100% PRODUCTION WEBRTC LIVEKIT APPLICATION
 *
 * Fitur Utama (100% Real LiveKit SDK, Tanpa Simulasi / Dummy Data):
 * 1. Tema "Elegant Light Blue" (Sleek Corporate Military):
 *    Navy/Dark Blue (`bg-slate-900`, `bg-blue-950`) + Aksen Biru Muda (`sky-300`, `blue-400`, `cyan-300`).
 * 2. Deep Link Join (Tanpa Instalasi APK):
 *    - Host menghasilkan QR Code berisi URL lengkap (`window.location.origin + "?room=OPS-123&pwd=yes"`).
 *    - Saat prajurit scan QR dengan kamera bawaan HP, `URLSearchParams` (`room` & `pwd`) dibaca otomatis,
 *      callsign random (`PERSONEL-XYZ`) dibuat otomatis, halaman LOBBY dilewati (bypass),
 *      langsung memanggil `/api/token` via `fetch()` dan masuk ke `IN_CALL`.
 * 3. Real-Time Chat (WebRTC Data Channel LiveKit):
 *    - Menggunakan hook resmi `useChat()` dari `@livekit/components-react` di dalam `<LiveKitRoom>`.
 *    - Tombol "CHAT" di Control Bar bawah membuka panel slide-over responsif di kanan layar.
 * 4. 100% Real LiveKit Hooks & Komponen:
 *    - `<VideoConference />` resmi terpasang penuh.
 *    - `<ConnectionQualityIndicator />` asli dari LiveKit di setiap kotak video & daftar personel.
 *    - `useConnectionState()`, `useParticipants()`, dan `useLocalParticipant()` untuk HUD Indikator Jaringan.
 *    - Pemanggilan nyata `fetch('/api/token')` ke backend `livekit-server-sdk`.
 * 5. Sandi Gabung Operasi: `yes`
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  ConnectionQualityIndicator,
  useConnectionState,
  useRoomContext,
  useParticipants,
  useLocalParticipant,
  useChat,
  ParticipantContextIfNeeded,
} from '@livekit/components-react';
import { ConnectionState, ConnectionQuality } from 'livekit-client';
import '@livekit/components-styles';
import { QRCodeSVG } from 'qrcode.react';
import {
  Shield,
  Radio,
  Lock,
  Users,
  PhoneOff,
  AlertTriangle,
  SlidersHorizontal,
  Wifi,
  WifiOff,
  QrCode,
  X,
  ZapOff,
  Zap,
  MessageSquare,
  Send,
  Copy,
  Check,
  ExternalLink,
  KeyRound,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

const DEFAULT_JOIN_PASSWORD = 'yes';

/**
 * Helper pembuat Callsign acak otomatis saat prajurit masuk lewat Deep Link QR
 */
function generateRandomCallsign() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PERSONEL-${suffix}`;
}

/**
 * Ikon Radar Taktis dengan palet Elegant Light Blue
 */
function TacticalRadarLogo({ className = 'w-9 h-9' }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-lg border border-sky-300/40 bg-blue-950/80 overflow-hidden shadow-[0_0_15px_rgba(56,189,248,0.15)] ${className}`}
    >
      <img
        src="/assets/aistudio/1794622160588-picsay_109de27f.png"
        alt="Logo DISKOMLEKAU"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

/**
 * ============================================================================
 * KOMPONEN HUD INDIKATOR JARINGAN REAL-TIME (DI DALAM <LiveKitRoom>)
 * Menggunakan 100% Real LiveKit Hooks:
 * - useConnectionState()
 * - useParticipants()
 * - useLocalParticipant()
 * - <ConnectionQualityIndicator />
 * ============================================================================
 */
function LiveKitHeaderHUD({ roomName, participantName, lowBandwidthMode, onOpenQrModal }) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  const stateBadgeConfig = {
    [ConnectionState.Connected]: {
      label: 'CONNECTED',
      badgeClass: 'border-sky-300/50 bg-blue-950/90 text-sky-200',
      dotClass: 'bg-sky-400',
      icon: Wifi,
    },
    [ConnectionState.Connecting]: {
      label: 'CONNECTING...',
      badgeClass: 'border-blue-400/50 bg-blue-950/80 text-blue-200',
      dotClass: 'bg-blue-400',
      icon: RefreshCw,
    },
    [ConnectionState.Reconnecting]: {
      label: 'RECONNECTING',
      badgeClass: 'border-amber-400/60 bg-amber-950/80 text-amber-200',
      dotClass: 'bg-amber-400',
      icon: AlertTriangle,
    },
    [ConnectionState.Disconnected]: {
      label: 'DISCONNECTED',
      badgeClass: 'border-red-400/60 bg-red-950/80 text-red-200',
      dotClass: 'bg-red-400',
      icon: WifiOff,
    },
  }[connectionState] || {
    label: String(connectionState).toUpperCase(),
    badgeClass: 'border-sky-300/40 bg-slate-900 text-sky-300',
    dotClass: 'bg-sky-300',
    icon: Wifi,
  };

  const StatusIcon = stateBadgeConfig.icon;

  return (
    <header className="shrink-0 bg-slate-900/95 border-b border-sky-300/25 px-3 py-2 sm:px-5 flex flex-wrap items-center justify-between gap-2 z-30">
      {/* Kiri: Identitas Komando & Room Aktif */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <TacticalRadarLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm md:text-base font-bold tracking-wider text-sky-200 truncate">
              TACTICAL VIDCOMM DISKOMLEKAU
            </h1>
            {lowBandwidthMode && (
              <span className="px-2 py-0.5 rounded-md bg-amber-950/90 border border-amber-400/60 text-[10px] font-semibold text-amber-300 tracking-wide uppercase shrink-0">
                VOICE-ONLY
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-300 font-mono">
            <span className="text-sky-300 font-semibold truncate">ROOM: {roomName}</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-300 truncate">{participantName}</span>
          </div>
        </div>
      </div>

      {/* Kanan: Real LiveKit ConnectionState HUD & Local ConnectionQualityIndicator */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        {/* Indikator Kualitas Sinyal Asli LiveKit untuk Local Participant */}
        {localParticipant && (
          <ParticipantContextIfNeeded participant={localParticipant}>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-sky-300/30 text-xs"
              title="Kualitas Sinyal WebRTC Anda (Real-time LiveKit)"
            >
              <ConnectionQualityIndicator className="!p-0 !bg-transparent" />
              <span className="hidden md:inline text-[11px] font-mono font-semibold text-sky-200 uppercase">
                {localParticipant.connectionQuality === ConnectionQuality.Excellent
                  ? 'EXCELLENT'
                  : localParticipant.connectionQuality === ConnectionQuality.Good
                  ? 'GOOD'
                  : localParticipant.connectionQuality === ConnectionQuality.Poor
                  ? 'POOR'
                  : localParticipant.connectionQuality === ConnectionQuality.Lost
                  ? 'LOST'
                  : 'SIGNAL'}
              </span>
            </div>
          </ParticipantContextIfNeeded>
        )}

        {/* Jumlah Personel Terhubung secara Real-Time */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-sky-300/30 text-xs font-mono text-sky-200"
          title="Jumlah Personel Aktif di Room"
        >
          <Users className="w-3.5 h-3.5 text-sky-300" />
          <span className="font-bold">{participants.length}</span>
          <span className="hidden lg:inline text-slate-300 text-[11px]">PERSONEL</span>
        </div>

        {/* Status Koneksi WebRTC (useConnectionState) */}
        <div
          className={`px-2.5 py-1 rounded-lg border text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 ${stateBadgeConfig.badgeClass}`}
        >
          <span className={`w-2 h-2 rounded-full ${stateBadgeConfig.dotClass}`} />
          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{stateBadgeConfig.label}</span>
        </div>

        {/* Tombol Cepat Tampilkan QR Deep Link Undangan */}
        <button
          type="button"
          onClick={onOpenQrModal}
          className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-300/40 text-sky-200 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
          title="Tampilkan QR Code Deep Link untuk Undang Personel"
        >
          <QrCode className="w-4 h-4 text-sky-300" />
          <span className="hidden md:inline">QR UNDANGAN</span>
        </button>
      </div>
    </header>
  );
}

/**
 * ============================================================================
 * KOMPONEN REAL-TIME CHAT (WEBRTC DATA CHANNEL LIVEKIT)
 * Menggunakan hook resmi `useChat()` dari `@livekit/components-react`
 * ============================================================================
 */
function RealTimeDataChannelChat({ isOpen, onClose, localCallsign, onUnreadChange }) {
  const { chatMessages, send, isSending } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const lastSeenCountRef = useRef(0);

  // Hitung pesan belum dibaca saat panel chat tertutup
  useEffect(() => {
    if (isOpen) {
      lastSeenCountRef.current = chatMessages.length;
      onUnreadChange(0);
    } else {
      const unread = Math.max(0, chatMessages.length - lastSeenCountRef.current);
      onUnreadChange(unread);
    }
  }, [chatMessages.length, isOpen, onUnreadChange]);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isSending) return;
    try {
      await send(trimmed);
      setInputMessage('');
    } catch (err) {
      console.error('Gagal mengirim pesan Data Channel LiveKit:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="absolute top-0 right-0 bottom-0 z-40 w-full sm:w-88 md:w-96 bg-slate-900/98 backdrop-blur-md border-l border-sky-300/35 shadow-[-12px_0_30px_rgba(2,6,23,0.7)] flex flex-col overflow-hidden">
      {/* Header Panel Chat */}
      <div className="shrink-0 px-4 py-3 bg-blue-950/90 border-b border-sky-300/25 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-300" />
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-sky-200 tracking-wide uppercase">
              KOMUNIKASI DATA TAKTIS (CHAT)
            </h3>
            <p className="text-[10px] text-sky-300/80 font-mono">
              LIVEKIT WEBRTC DATA CHANNEL · REAL-TIME
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-sky-300/30 text-sky-200 cursor-pointer"
          title="Tutup Panel Chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Daftar Pesan Real-Time */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-2.5">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 text-slate-400">
            <MessageSquare className="w-8 h-8 text-sky-400/40 mb-2" />
            <p className="text-xs font-semibold text-sky-200/80">
              Kanal Chat Operasi Siap Digunakan
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Seluruh pesan dikirim secara real-time melalui jalur WebRTC Data Channel terenkripsi.
            </p>
          </div>
        ) : (
          chatMessages.map((msg, idx) => {
            const senderIdentity = msg.from?.name || msg.from?.identity || 'PERSONEL';
            const isSelf =
               msg.from?.isLocal ||
              senderIdentity.toUpperCase() === String(localCallsign).toUpperCase();
            const timeStr = new Date(msg.timestamp).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={msg.id || `${msg.timestamp}-${idx}`}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-sky-300">
                    {isSelf ? `${senderIdentity} (ANDA)` : senderIdentity}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">{timeStr}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs sm:text-sm leading-relaxed break-words ${
                    isSelf
                      ? 'bg-sky-500/25 border border-sky-300/50 text-sky-100'
                      : 'bg-blue-950/90 border border-blue-400/30 text-slate-100'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Form Input Pesan */}
      <form
        onSubmit={handleSendMessage}
        className="shrink-0 p-3 bg-blue-950/90 border-t border-sky-300/25 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ketik pesan komando / koordinat..."
          className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-sky-300/35 text-xs sm:text-sm text-sky-100 placeholder-slate-400 focus:outline-none focus:border-sky-300"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">KIRIM</span>
        </button>
      </form>
    </aside>
  );
}

/**
 * ============================================================================
 * MODAL DAFTAR PERSONEL AKTIF & SINYAL REAL-TIME (<ConnectionQualityIndicator />)
 * ============================================================================
 */
function RealTimeParticipantsModal({ isOpen, onClose, roomName }) {
  const participants = useParticipants();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[80dvh] bg-slate-900 border border-sky-300/40 rounded-xl shadow-[0_0_40px_rgba(56,189,248,0.2)] flex flex-col overflow-hidden">
        <div className="px-4 py-3 bg-blue-950/90 border-b border-sky-300/25 flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-sky-200 tracking-wider uppercase">
              PERSONEL TERHUBUNG ({participants.length})
            </h3>
            <p className="text-[10px] font-mono text-sky-300/80">
              ROOM: {roomName} · INDIKATOR SINYAL REAL-TIME LIVEKIT
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-sky-300/30 text-sky-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
          {participants.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Menunggu data peserta dari server LiveKit...
            </p>
          ) : (
            participants.map((p) => (
              <ParticipantContextIfNeeded key={p.identity} participant={p}>
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-blue-950/60 border border-sky-300/25">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserCheck className="w-4 h-4 text-sky-300 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-bold text-sky-100 truncate">
                        {p.name || p.identity} {p.isLocal ? '(ANDA)' : ''}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {p.isSpeaking ? 'SEDANG BERBICARA' : 'STANDBY'}
                      </p>
                    </div>
                  </div>

                  {/* Komponen Asli <ConnectionQualityIndicator /> dari @livekit/components-react */}
                  <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-900 border border-sky-300/25">
                    <ConnectionQualityIndicator />
                  </div>
                </div>
              </ParticipantContextIfNeeded>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * WORKSPACE UTAMA DI DALAM <LiveKitRoom> (STATE: IN_CALL)
 * Mengelola Low-Bandwidth Mode, VideoConference, Real-Time Chat, & Control Bar
 * ============================================================================
 */
function InCallWorkspace({
  roomName,
  participantName,
  lowBandwidthMode,
  onToggleLowBandwidth,
  onLeave,
  onOpenQrModal,
}) {
  const room = useRoomContext();
  const participants = useParticipants();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  // Sinkronkan mode Hemat Bandwidth (Voice-Only) langsung ke track WebRTC LiveKit
  useEffect(() => {
    if (!room) return;
    try {
      room.localParticipant?.setCameraEnabled(!lowBandwidthMode);
      room.remoteParticipants?.forEach((p) => {
        p.videoTrackPublications?.forEach((pub) => {
          if (typeof pub.setEnabled === 'function') {
            pub.setEnabled(!lowBandwidthMode);
          }
        });
      });
    } catch (err) {
      console.warn('Gagal mengatur mode hemat bandwidth:', err);
    }
  }, [room, lowBandwidthMode]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* 1. HEADER ATAS DENGAN REAL LIVEKIT CONNECTION STATE & QUALITY INDICATOR */}
      <LiveKitHeaderHUD
        roomName={roomName}
        participantName={participantName}
        lowBandwidthMode={lowBandwidthMode}
        onOpenQrModal={onOpenQrModal}
      />

      {/* 2. AREA TENGAH: LIVEKIT <VideoConference /> + SLIDE-OVER REAL-TIME CHAT */}
      <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-slate-900">
        <VideoConference />

        {/* Overlay Indikator Sinyal Real-Time (<ConnectionQualityIndicator />) Pojok Kiri Atas */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none hidden sm:flex flex-wrap gap-1.5 max-w-md">
          {participants.slice(0, 6).map((p) => (
            <ParticipantContextIfNeeded key={p.identity} participant={p}>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-xs border border-sky-300/35 text-[10px] font-mono text-sky-200 shadow-sm">
                <span className="truncate max-w-[110px] font-semibold">
                  {p.name || p.identity}
                </span>
                <ConnectionQualityIndicator className="!p-0 !bg-transparent" />
              </div>
            </ParticipantContextIfNeeded>
          ))}
        </div>

        {/* Panel Real-Time Chat (Data Channel LiveKit) */}
        <RealTimeDataChannelChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          localCallsign={participantName}
          onUnreadChange={setUnreadChatCount}
        />

        {/* Modal Daftar Personel & Kualitas Sinyal */}
        <RealTimeParticipantsModal
          isOpen={showParticipantsModal}
          onClose={() => setShowParticipantsModal(false)}
          roomName={roomName}
        />
      </div>

      {/* 3. BOTTOM TACTICAL ACTION BAR (CHAT, QR DEEP LINK, VOICE-ONLY, PERSONEL, LEAVE) */}
      <div className="shrink-0 bg-blue-950/95 border-t border-sky-300/30 px-3 py-2 sm:px-5 flex items-center justify-between gap-2 z-30">
        {/* Info Room & Callsign di Kiri */}
        <div className="hidden md:flex items-center gap-2.5 text-xs font-mono text-sky-200">
          <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-sky-300/30">
            ROOM: <strong className="text-sky-300">{roomName}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-sky-300/30">
            CALLSIGN: <strong className="text-cyan-300">{participantName}</strong>
          </span>
        </div>

        {/* Deretan Tombol Kontrol Taktis */}
        <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
          {/* Tombol Toggle Real-Time Chat (Data Channel) */}
          <button
            type="button"
            onClick={() => setIsChatOpen((prev) => !prev)}
            className={`relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex-1 md:flex-initial ${
              isChatOpen
                ? 'bg-sky-400 text-slate-950 border-sky-200 shadow-[0_0_16px_rgba(56,189,248,0.4)]'
                : 'bg-slate-900/90 hover:bg-slate-800 text-sky-200 border-sky-300/40'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>CHAT</span>
            {unreadChatCount > 0 && !isChatOpen && (
              <span className="px-1.5 py-0.2 rounded-full bg-sky-400 text-slate-950 font-mono text-[10px] font-extrabold">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Tombol Daftar Personel & Kualitas Sinyal */}
          <button
            type="button"
            onClick={() => setShowParticipantsModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-sky-300/40 bg-slate-900/90 hover:bg-slate-800 text-sky-200 text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer flex-1 md:flex-initial"
          >
            <Users className="w-4 h-4 text-sky-300 shrink-0" />
            <span>PERSONEL ({participants.length})</span>
          </button>

          {/* Tombol Mode Hemat Bandwidth (Voice-Only) */}
          <button
            type="button"
            onClick={() => onToggleLowBandwidth(!lowBandwidthMode)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex-1 md:flex-initial ${
              lowBandwidthMode
                ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.35)]'
                : 'bg-slate-900/90 hover:bg-slate-800 text-sky-200 border-sky-300/40'
            }`}
            title="Matikan video untuk menghemat bandwidth di lapangan"
          >
            {lowBandwidthMode ? (
              <Zap className="w-4 h-4 shrink-0" />
            ) : (
              <ZapOff className="w-4 h-4 text-sky-300 shrink-0" />
            )}
            <span className="hidden sm:inline">
              {lowBandwidthMode ? 'VOICE-ONLY AKTIF' : 'HEMAT DATA'}
            </span>
          </button>

          {/* Tombol QR Deep Link */}
          <button
            type="button"
            onClick={onOpenQrModal}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-sky-300/40 bg-slate-900/90 hover:bg-slate-800 text-sky-200 text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
            title="Tampilkan QR Code Deep Link"
          >
            <QrCode className="w-4 h-4 text-sky-300 shrink-0" />
            <span className="hidden lg:inline">QR LINK</span>
          </button>

          {/* Tombol Keluar Room */}
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-400/80 bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer shrink-0"
          >
            <PhoneOff className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">KELUAR</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * KOMPONEN UTAMA APLIKASI (App.jsx)
 * ============================================================================
 */
export default function App() {
  // State Utama: 'LOBBY' | 'IN_CALL'
  const [appState, setAppState] = useState('LOBBY');

  // Form State di LOBBY
  const [participantName, setParticipantName] = useState('KOMANDAN-01');
  const [roomName, setRoomName] = useState('OPS-GARUDA-01');
  const [joinPassword, setJoinPassword] = useState(DEFAULT_JOIN_PASSWORD);
  const [customServerUrl, setCustomServerUrl] = useState(
    import.meta.env.VITE_LIVEKIT_URL || ''
  );
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  // State Koneksi Real LiveKit
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState(import.meta.env.VITE_LIVEKIT_URL || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeepLinkJoining, setIsDeepLinkJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Mode Hemat Bandwidth & Modal QR Deep Link
  const [lowBandwidthMode, setLowBandwidthMode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Membentuk URL Deep Link Lengkap untuk QR Code (Tanpa Instalasi APK)
  const cleanRoomForLink = (roomName || 'OPS-GARUDA-01').trim().toUpperCase();
  const cleanPwdForLink = (joinPassword || DEFAULT_JOIN_PASSWORD).trim();
  const deepLinkUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(
          cleanRoomForLink
        )}&pwd=${encodeURIComponent(cleanPwdForLink)}`
      : '';

  /**
   * Fungsi Nyata Pemanggil Endpoint `/api/token` (livekit-server-sdk)
   */
  const requestTokenAndJoin = useCallback(
    async (targetRoom, targetCallsign, targetPwd) => {
      setErrorMsg('');
      const finalRoom = String(targetRoom || '').trim().toUpperCase();
      const finalCallsign = String(targetCallsign || '').trim().toUpperCase();
      const finalPwd = String(targetPwd ?? '').trim();

      if (!finalRoom || !finalCallsign) {
        setErrorMsg('Harap lengkapi Callsign dan Nama Room Operasi terlebih dahulu.');
        return false;
      }

      if (finalPwd.toLowerCase() !== DEFAULT_JOIN_PASSWORD) {
        setErrorMsg('Sandi Gabung salah. Gunakan sandi gabung resmi: yes');
        return false;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: finalRoom,
            participantName: finalCallsign,
            pwd: finalPwd,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Gagal mendapatkan token otentikasi dari server /api/token.'
          );
        }

        const resolvedWssUrl =
          customServerUrl.trim() || data.serverUrl || import.meta.env.VITE_LIVEKIT_URL || '';

        if (!resolvedWssUrl) {
          throw new Error(
            'URL Server LiveKit (WSS) belum dikonfigurasi di environment server (LIVEKIT_URL / VITE_LIVEKIT_URL).'
          );
        }

        setParticipantName(finalCallsign);
        setRoomName(finalRoom);
        setToken(data.token);
        setServerUrl(resolvedWssUrl);
        setAppState('IN_CALL');
        return true;
      } catch (err) {
        setErrorMsg(err.message || 'Gagal menghubungi server /api/token.');
        return false;
      } finally {
        setIsLoading(false);
        setIsDeepLinkJoining(false);
      }
    },
    [customServerUrl]
  );

  /**
   * ==========================================================================
   * 2. INISIALISASI DEEP LINK JOIN (`URLSearchParams`)
   * Jika URL memiliki parameter `?room=...&pwd=...`, otomatis bypass LOBBY,
   * panggil `/api/token`, dan masukkan prajurit langsung ke `IN_CALL`.
   * ==========================================================================
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const pwdParam = params.get('pwd');
    const callsignParam = params.get('callsign') || params.get('name');

    if (roomParam && pwdParam) {
      const autoCallsign = callsignParam
        ? callsignParam.trim().toUpperCase()
        : generateRandomCallsign();

      setRoomName(roomParam.trim().toUpperCase());
      setJoinPassword(pwdParam.trim());
      setParticipantName(autoCallsign);
      setIsDeepLinkJoining(true);

      requestTokenAndJoin(roomParam, autoCallsign, pwdParam);
    }
  }, [requestTokenAndJoin]);

  const handleLobbySubmit = async (e) => {
    e.preventDefault();
    await requestTokenAndJoin(roomName, participantName, joinPassword);
  };

  const handleLeaveCall = () => {
    setToken('');
    setAppState('LOBBY');
    // Bersihkan query params URL jika sebelumnya masuk lewat Deep Link agar bisa ganti room di Lobby
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleCopyDeepLink = async () => {
    if (!deepLinkUrl) return;
    try {
      await navigator.clipboard.writeText(deepLinkUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback copy
    }
  };

  return (
    /* CONTAINER UTAMA: FULL SCREEN FIT (h-[100dvh] w-full overflow-hidden) */
    <div
      className={`flex flex-col h-[100dvh] w-full bg-slate-900 text-sky-100 overflow-hidden select-none ${
        lowBandwidthMode ? 'low-bandwidth-active' : ''
      }`}
    >
      {/* ====================================================================
       * LAYAR AUTO-JOIN SAAT MEMBUKA DEEP LINK QR DARI KAMERA HP
       * ==================================================================== */}
      {isDeepLinkJoining && appState === 'LOBBY' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-center">
          <TacticalRadarLogo className="w-16 h-16 mb-4 animate-pulse" />
          <h2 className="text-lg sm:text-xl font-bold text-sky-200 tracking-wide uppercase">
            MENGHUBUNGKAN KE KANAL OPERASI...
          </h2>
          <p className="text-xs sm:text-sm text-sky-300/80 font-mono mt-1">
            ROOM: {roomName} · CALLSIGN: {participantName}
          </p>
          <p className="text-xs text-slate-400 mt-3 max-w-sm">
            Otentikasi Deep Link otomatis sedang meminta token enkripsi dari server LiveKit...
          </p>
        </div>
      )}

      {/* ====================================================================
       * STATE 1: HALAMAN LOBBY (TEMA ELEGANT LIGHT BLUE / CORPORATE MILITARY)
       * ==================================================================== */}
      {!isDeepLinkJoining && appState === 'LOBBY' && (
        <>
          {/* Header Lobby */}
          <header className="shrink-0 bg-blue-950/90 border-b border-sky-300/25 px-4 py-2.5 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TacticalRadarLogo className="w-9 h-9" />
              <div>
                <h1 className="text-sm sm:text-base md:text-lg font-extrabold tracking-wider text-sky-200">
                  TACTICAL VTC DISKOMLEKAU
                </h1>
                <p className="text-[10px] sm:text-xs text-sky-300/80 font-mono tracking-wider">
                  SECURE WEBRTC COMMAND & PLATOON TELECONFERENCE
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-3 py-1.5 rounded-lg bg-sky-400/15 hover:bg-sky-400/25 border border-sky-300/45 text-sky-200 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-sky-300" />
                <span className="hidden sm:inline">QR DEEP LINK</span>
              </button>
            </div>
          </header>

          {/* Konten Utama Lobby */}
          <main className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-6 overflow-y-auto relative bg-gradient-to-br from-slate-900 via-blue-950/85 to-slate-900">
            {/* Dekorasi Grid Halus */}
            <div
              className="absolute inset-0 pointer-events-none opacity-15"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(125,211,252,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(125,211,252,0.18) 1px, transparent 1px)',
                backgroundSize: '36px 36px',
              }}
            />

            <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
              {/* Kolom Kiri (7 Kolom): Form Buat / Gabung Operasi */}
              <div className="lg:col-span-7 bg-slate-900/95 border border-sky-300/35 rounded-2xl p-5 sm:p-6 shadow-[0_12px_40px_rgba(2,132,199,0.15)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-sky-300/20 pb-3.5 mb-4">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-widest text-sky-300 font-semibold flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-sky-300" />
                        OTENTIKASI KANAL KOMANDO
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                        Terminal Koneksi VTC
                      </h2>
                    </div>
                    <Radio className="w-6 h-6 text-sky-300 shrink-0" />
                  </div>

                  <form onSubmit={handleLobbySubmit} className="space-y-3.5">
                    {/* Input 1: Callsign / Identitas Personel */}
                    <div>
                      <label
                        htmlFor="callsign-input"
                        className="block text-xs font-bold uppercase tracking-wider text-sky-200 mb-1"
                      >
                        CALLSIGN / NAMA PERSONEL
                      </label>
                      <input
                        id="callsign-input"
                        type="text"
                        required
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value.toUpperCase())}
                        placeholder="CONTOH: KOMANDAN-01 / PERSONEL-A1"
                        autoComplete="off"
                        className="w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider uppercase bg-blue-950/70 border border-sky-300/40 rounded-lg text-sky-100 placeholder-slate-400 focus:outline-none focus:border-sky-300"
                      />
                    </div>

                    {/* Grid 2 Kolom: Nama Room & Sandi Gabung */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="room-input"
                          className="block text-xs font-bold uppercase tracking-wider text-sky-200 mb-1"
                        >
                          KODE ROOM / OPERASI
                        </label>
                        <input
                          id="room-input"
                          type="text"
                          required
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value.toUpperCase())}
                          placeholder="OPS-GARUDA-01"
                          autoComplete="off"
                          className="w-full px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider uppercase bg-blue-950/70 border border-sky-300/40 rounded-lg text-cyan-200 placeholder-slate-400 focus:outline-none focus:border-sky-300"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="pwd-input"
                          className="block text-xs font-bold uppercase tracking-wider text-sky-200 mb-1 flex items-center justify-between"
                        >
                          <span>SANDI GABUNG</span>
                          <span className="text-[10px] font-mono text-sky-300">DEFAULT: yes</span>
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-sky-300/70 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="pwd-input"
                            type="text"
                            required
                            value={joinPassword}
                            onChange={(e) => setJoinPassword(e.target.value)}
                            placeholder="yes"
                            autoComplete="off"
                            className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono font-bold tracking-wider bg-blue-950/70 border border-sky-300/40 rounded-lg text-sky-100 placeholder-slate-400 focus:outline-none focus:border-sky-300"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Opsi Server WSS LiveKit & Mode Hemat Bandwidth */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                        className="text-xs text-sky-300/80 hover:text-sky-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>
                          {showAdvancedConfig
                            ? 'Sembunyikan URL Server WSS'
                            : 'Atur URL Server LiveKit (Opsional)'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLowBandwidthMode(!lowBandwidthMode)}
                        className={`text-[11px] px-2.5 py-1 rounded-md border font-semibold tracking-wide uppercase cursor-pointer transition-colors ${
                          lowBandwidthMode
                            ? 'bg-amber-400/20 border-amber-300 text-amber-200'
                            : 'bg-blue-950/60 border-sky-300/30 text-sky-300 hover:border-sky-300'
                        }`}
                      >
                        {lowBandwidthMode ? '✓ Mode Voice-Only' : 'Mode Video Penuh'}
                      </button>
                    </div>

                    {showAdvancedConfig && (
                      <div>
                        <input
                          type="text"
                          value={customServerUrl}
                          onChange={(e) => setCustomServerUrl(e.target.value)}
                          placeholder="wss://nama-proyek-anda.livekit.cloud"
                          className="w-full px-3 py-2 text-xs font-mono bg-blue-950/80 border border-sky-300/35 rounded-lg text-sky-100 placeholder-slate-400 focus:outline-none focus:border-sky-300"
                        />
                      </div>
                    )}

                    {/* Pesan Error Nyata dari API / Validasi */}
                    {errorMsg && (
                      <div className="p-3 rounded-lg bg-red-950/80 border border-red-400/60 text-red-100 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {/* Tombol Submit: Masuk ke Room */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.35)] transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isLoading
                          ? 'MENGHUBUNGKAN KE LIVEKIT SERVER...'
                          : 'MASUK / MULAI OPERASI VTC'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Footer Info Keamanan */}
                <div className="mt-4 pt-3 border-t border-sky-300/15 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1.5 text-sky-300 font-medium">
                    <Lock className="w-3.5 h-3.5" />
                    WebRTC DTLS-SRTP Encrypted
                  </span>
                  <span className="font-mono text-sky-300/80">LIVEKIT SDK v2</span>
                </div>
              </div>

              {/* Kolom Kanan (5 Kolom): Kartu QR Code Deep Link Join (Tanpa Instalasi APK) */}
              <div className="lg:col-span-5 bg-blue-950/80 border border-sky-300/35 rounded-2xl p-5 sm:p-6 shadow-[0_12px_40px_rgba(2,132,199,0.12)] flex flex-col items-center justify-between text-center">
                <div className="w-full">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-300 font-semibold">
                    INSTANT DEEP LINK JOIN
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                    Scan QR Kamera HP (Tanpa APK)
                  </h3>
                  <p className="text-xs text-sky-200/80 mt-1 leading-relaxed">
                    Prajurit cukup arahkan kamera bawaan HP ke QR ini untuk otomatis masuk ke Room{' '}
                    <strong className="text-sky-300 font-mono">{cleanRoomForLink}</strong>.
                  </p>
                </div>

                {/* QR Code Asli Standar ISO yang Memuat URL Lengkap Aplikasi + Parameter */}
                <div className="my-4 p-3.5 rounded-2xl bg-white border-4 border-sky-300 shadow-[0_0_30px_rgba(125,211,252,0.25)]">
                  <QRCodeSVG
                    value={deepLinkUrl || 'https://livekit.io'}
                    size={168}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                  />
                </div>

                {/* Kotak URL Deep Link & Tombol Salin */}
                <div className="w-full space-y-2">
                  <div className="px-3 py-2 rounded-lg bg-slate-900/90 border border-sky-300/30 text-[10px] font-mono text-sky-300 truncate">
                    {deepLinkUrl}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleCopyDeepLink}
                      className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-sky-300/40 text-sky-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-cyan-300" />
                          <span>TERSALIN</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-sky-300" />
                          <span>SALIN LINK</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="py-2 px-3 rounded-lg bg-sky-400/20 hover:bg-sky-400/30 border border-sky-300/50 text-sky-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-sky-300" />
                      <span>PERBESAR QR</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </>
      )}

      {/* ====================================================================
       * STATE 2: IN_CALL (100% REAL <LiveKitRoom> + <VideoConference /> + CHAT)
       * ==================================================================== */}
      {appState === 'IN_CALL' && token && serverUrl && (
        <LiveKitRoom
          video={!lowBandwidthMode}
          audio={true}
          token={token}
          serverUrl={serverUrl}
          connect={true}
          data-lk-theme="default"
          onDisconnected={handleLeaveCall}
          onError={(err) => {
            console.error('[LiveKit WebRTC Error]:', err);
            setErrorMsg(err?.message || 'Terjadi gangguan koneksi ke server LiveKit.');
          }}
          className="!h-full !w-full !overflow-hidden flex flex-col"
        >
          <InCallWorkspace
            roomName={roomName}
            participantName={participantName}
            lowBandwidthMode={lowBandwidthMode}
            onToggleLowBandwidth={setLowBandwidthMode}
            onLeave={handleLeaveCall}
            onOpenQrModal={() => setShowQrModal(true)}
          />
        </LiveKitRoom>
      )}

      {/* ====================================================================
       * MODAL POP-UP QR CODE DEEP LINK (UNTUK DI-SCAN KAMERA BAWAAN HP)
       * ==================================================================== */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-sky-300/45 rounded-2xl p-5 shadow-[0_0_45px_rgba(56,189,248,0.25)] flex flex-col items-center text-center gap-3.5">
            <div className="w-full flex items-center justify-between border-b border-sky-300/25 pb-2.5">
              <div className="text-left">
                <h3 className="text-xs sm:text-sm font-bold text-sky-200 tracking-wider uppercase">
                  QR DEEP LINK OPERASI
                </h3>
                <p className="text-[10px] font-mono text-sky-300/80">
                  SCAN DENGAN KAMERA HP · TANPA APK
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1.5 rounded-lg bg-blue-950 border border-sky-300/30 text-sky-200 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white border-4 border-sky-300 shadow-lg">
              <QRCodeSVG
                value={deepLinkUrl || 'https://livekit.io'}
                size={210}
                level="M"
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>

            <div className="w-full p-3 rounded-xl bg-blue-950/80 border border-sky-300/30 text-xs space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">ROOM:</span>
                <span className="text-sky-300 font-bold">{cleanRoomForLink}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">SANDI GABUNG:</span>
                <span className="text-cyan-300 font-bold">{cleanPwdForLink}</span>
              </div>
            </div>

            <div className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-sky-300/25 text-[10px] font-mono text-sky-300 break-all">
              {deepLinkUrl}
            </div>

            <button
              type="button"
              onClick={handleCopyDeepLink}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>URL DEEP LINK TERSALIN</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>SALIN URL DEEP LINK</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
