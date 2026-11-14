/**
 * ============================================================================
 * FILE BACKEND: api/token.js (Vercel Serverless Function & Express Route)
 * TACTICAL VIDCOMM DISKOMLEKAU - LiveKit Access Token Generator (Production)
 * ============================================================================
 */

import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed. Gunakan metode HTTP POST atau GET.',
    });
  }

  try {
    const source = req.method === 'GET' ? req.query : req.body || {};
    const { roomName, participantName, sandi, pwd } = source;

    if (!roomName || !participantName) {
      return res.status(400).json({
        error: 'Parameter roomName (Nama Room) dan participantName (Callsign) wajib diisi.',
      });
    }

    const providedSandi = String(sandi ?? pwd ?? '').trim();
    if (!providedSandi) {
      return res.status(401).json({
        error: 'Sandi Gabung operasi wajib diisi.',
      });
    }

    if (
      process.env.VTC_JOIN_PASSWORD &&
      providedSandi.toLowerCase() !== process.env.VTC_JOIN_PASSWORD.trim().toLowerCase()
    ) {
      return res.status(401).json({
        error: 'Sandi Gabung tidak valid.',
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY || process.env.VITE_LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET || process.env.VITE_LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || process.env.VITE_LIVEKIT_URL || '';

    if (!apiKey || !apiSecret) {
      return res.status(500).json({
        error:
          'Server belum memiliki konfigurasi LIVEKIT_API_KEY dan LIVEKIT_API_SECRET di Environment Variables.',
        missingCredentials: true,
      });
    }

    const cleanRoom = String(roomName).trim().toUpperCase();
    const cleanIdentity = String(participantName).trim().toUpperCase();

    const at = new AccessToken(apiKey, apiSecret, {
      identity: cleanIdentity,
      name: cleanIdentity,
      ttl: '6h',
    });

    at.addGrant({
      roomJoin: true,
      room: cleanRoom,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return res.status(200).json({
      token,
      serverUrl: livekitUrl,
      roomName: cleanRoom,
      participantName: cleanIdentity,
    });
  } catch (error) {
    console.error('[TACTICAL VIDCOMM TOKEN ERROR]:', error);
    return res.status(500).json({
      error: 'Gagal membuat AccessToken LiveKit dari livekit-server-sdk.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
