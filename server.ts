import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface RoomPlayer {
  id: string;
  name: string;
  charId: string;
  skinIdx: number;
  ws: WebSocket;
  isHost: boolean;
}

interface BattleRoom {
  code: string;
  players: Map<string, RoomPlayer>;
  status: 'waiting' | 'in_battle' | 'ended';
}

const rooms = new Map<string, BattleRoom>();

// Helper to broadcast room state to all members
function broadcastRoomState(room: BattleRoom) {
  const playersSummary = Array.from(room.players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    charId: p.charId,
    skinIdx: p.skinIdx,
    isHost: p.isHost,
    ready: true,
  }));

  const payload = JSON.stringify({
    type: 'room_state',
    state: {
      code: room.code,
      status: room.status,
      players: playersSummary,
    },
  });

  room.players.forEach((p) => {
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(payload);
    }
  });
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      activeRooms: rooms.size,
      time: new Date().toISOString(),
    });
  });

  // Rooms list / diagnostics
  app.get('/api/rooms', (_req, res) => {
    const list = Array.from(rooms.values()).map((r) => ({
      code: r.code,
      playerCount: r.players.size,
      status: r.status,
    }));
    res.json({ rooms: list });
  });

  // Setup WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomCode: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (data: string | Buffer) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          case 'join_room': {
            const code = (msg.code || '').trim().toUpperCase();
            if (!code) return;

            let room = rooms.get(code);
            if (!room) {
              room = {
                code,
                players: new Map(),
                status: 'waiting',
              };
              rooms.set(code, room);
            }

            currentRoomCode = code;
            currentPlayerId = msg.playerId;

            const isFirst = room.players.size === 0;
            const existingPlayer = room.players.get(msg.playerId);

            room.players.set(msg.playerId, {
              id: msg.playerId,
              name: msg.playerName || (isFirst ? 'שחקן 1 (מארח)' : 'שחקן 2 (אורח)'),
              charId: msg.charId || 'spark',
              skinIdx: msg.skinIdx || 0,
              ws,
              isHost: existingPlayer ? existingPlayer.isHost : isFirst,
            });

            broadcastRoomState(room);
            break;
          }

          case 'start_battle': {
            const code = (msg.code || currentRoomCode || '').trim().toUpperCase();
            const room = rooms.get(code);
            if (!room) return;

            room.status = 'in_battle';

            const playersSummary = Array.from(room.players.values()).map((p) => ({
              id: p.id,
              name: p.name,
              charId: p.charId,
              skinIdx: p.skinIdx,
              isHost: p.isHost,
            }));

            const payload = JSON.stringify({
              type: 'battle_started',
              state: {
                code: room.code,
                status: 'in_battle',
                players: playersSummary,
              },
            });

            room.players.forEach((p) => {
              if (p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(payload);
              }
            });
            break;
          }

          case 'player_update': {
            const code = (msg.code || currentRoomCode || '').trim().toUpperCase();
            const room = rooms.get(code);
            if (!room) return;

            // Forward to the other player in room
            const payload = JSON.stringify(msg);
            room.players.forEach((p) => {
              if (p.id !== msg.playerId && p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(payload);
              }
            });
            break;
          }

          case 'player_shoot': {
            const code = (msg.code || currentRoomCode || '').trim().toUpperCase();
            const room = rooms.get(code);
            if (!room) return;

            const payload = JSON.stringify(msg);
            room.players.forEach((p) => {
              if (p.id !== msg.playerId && p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(payload);
              }
            });
            break;
          }

          case 'player_super': {
            const code = (msg.code || currentRoomCode || '').trim().toUpperCase();
            const room = rooms.get(code);
            if (!room) return;

            const payload = JSON.stringify(msg);
            room.players.forEach((p) => {
              if (p.id !== msg.playerId && p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(payload);
              }
            });
            break;
          }

          case 'hit_registered': {
            const code = (msg.code || currentRoomCode || '').trim().toUpperCase();
            const room = rooms.get(code);
            if (!room) return;

            const payload = JSON.stringify(msg);
            room.players.forEach((p) => {
              if (p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(payload);
              }
            });
            break;
          }

          case 'leave_room': {
            const code = (msg.code || currentRoomCode || '').trim().toUpperCase();
            const room = rooms.get(code);
            if (room && currentPlayerId) {
              room.players.delete(currentPlayerId);
              if (room.players.size === 0) {
                rooms.delete(code);
              } else {
                room.status = 'waiting';
                const leftMsg = JSON.stringify({ type: 'opponent_left' });
                room.players.forEach((p) => {
                  if (p.ws.readyState === WebSocket.OPEN) {
                    p.ws.send(leftMsg);
                  }
                });
                broadcastRoomState(room);
              }
            }
            currentRoomCode = null;
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomCode && currentPlayerId) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          room.players.delete(currentPlayerId);
          if (room.players.size === 0) {
            rooms.delete(currentRoomCode);
          } else {
            room.status = 'waiting';
            const leftMsg = JSON.stringify({ type: 'opponent_left' });
            room.players.forEach((p) => {
              if (p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(leftMsg);
              }
            });
            broadcastRoomState(room);
          }
        }
      }
    });
  });

  // Vite middleware in dev; static file serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Brawl Stars Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
