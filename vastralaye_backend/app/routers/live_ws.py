# app/routers/live_ws.py
import json
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

# adjust these imports to match your project structure
from app.models.models import (
    SessionRequest,
    AstrologerDetail,
    LiveViewer,
    LiveChatMessage,  # present but not used for persistence here
    india_tz,
)
from app.utils.authenticate import get_current_user  # optional if you want auth on WS

router = APIRouter()

class LiveConnectionManager:
    def __init__(self):
        # channel -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # channel -> set of viewer_user_ids (local tracking for viewer_count)
        self.channel_viewers: Dict[str, set] = {}

    async def connect(self, channel: str, websocket: WebSocket):
        await websocket.accept()
        conns = self.active_connections.get(channel) or []
        conns.append(websocket)
        self.active_connections[channel] = conns

    def disconnect(self, channel: str, websocket: WebSocket):
        conns = self.active_connections.get(channel)
        if not conns:
            return
        try:
            conns.remove(websocket)
            if conns:
                self.active_connections[channel] = conns
            else:
                del self.active_connections[channel]
        except ValueError:
            pass

    async def broadcast(self, channel: str, message: dict):
        conns = self.active_connections.get(channel) or []
        for ws in list(conns):
            try:
                await ws.send_json(message)
            except Exception:
                # ignore broken sockets for now
                pass

    def add_viewer_local(self, channel: str, viewer_user_id: str):
        vs = self.channel_viewers.get(channel) or set()
        vs.add(viewer_user_id)
        self.channel_viewers[channel] = vs

    def remove_viewer_local(self, channel: str, viewer_user_id: str):
        vs = self.channel_viewers.get(channel)
        if not vs:
            return
        vs.discard(viewer_user_id)
        if vs:
            self.channel_viewers[channel] = vs
        else:
            self.channel_viewers.pop(channel, None)

    def get_local_count(self, channel: str) -> int:
        vs = self.channel_viewers.get(channel) or set()
        return len(vs)

manager = LiveConnectionManager()

# WebSocket endpoint for Live chat & events
@router.websocket("/ws/live/{channel}")
async def websocket_live_endpoint(websocket: WebSocket, channel: str):
    """
    Live WS endpoint (separate from your 1:1 chat WS).
    Expected incoming messages (JSON):
      - {"action":"user_joined", "user_id":"u123", "user_name":"Jincy"}   # persists join
      - {"action":"user_left", "user_id":"u123"}                         # persists leave (left_at)
      - {"action":"chat", "user_id":"u123", "user_name":"Jincy", "message":"Hi"}  # broadcast only
      - {"action":"live_end"}  # host ends live (server marks isLive=False)
    NOTE: Chat messages are NOT stored in DB (per your choice). Join records ARE stored.
    """
    await manager.connect(channel, websocket)
    current_viewer_id: Optional[str] = None

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            # ---------- USER JOINED ----------
            if action == "user_joined":
                user_id = data.get("user_id")
                user_name = data.get("user_name", "")

                # persist join in DB
                db: Session = SessionLocal()
                try:
                    # find astrologer via liveChannel
                    astro = db.query(AstrologerDetail).filter(AstrologerDetail.liveChannel == channel).first()
                    astro_id = astro.astro_id if astro else None

                    lv = LiveViewer(
                        live_channel=channel,
                        astrologer_astro_id=astro_id or "",
                        viewer_user_id=user_id,
                        joined_at=datetime.utcnow()
                    )
                    db.add(lv)
                    db.commit()
                    db.refresh(lv)
                finally:
                    db.close()

                # track locally
                if user_id:
                    manager.add_viewer_local(channel, user_id)
                    current_viewer_id = user_id

                # broadcast join notice + viewer_count (local)
                await manager.broadcast(channel, {"event": "user_joined", "user_id": user_id, "user_name": user_name})
                count = manager.get_local_count(channel)
                await manager.broadcast(channel, {"event": "viewer_count_update", "count": count})

            # ---------- USER LEFT (explicit leave) ----------
            elif action == "user_left":
                user_id = data.get("user_id")
                # mark leave in DB (latest record where left_at is NULL)
                if user_id:
                    db: Session = SessionLocal()
                    try:
                        rec = (db.query(LiveViewer)
                               .filter(LiveViewer.live_channel == channel,
                                       LiveViewer.viewer_user_id == user_id,
                                       LiveViewer.left_at.is_(None))
                               .order_by(LiveViewer.joined_at.desc())
                               .first())
                        if rec:
                            rec.left_at = datetime.utcnow()
                            db.add(rec)
                            db.commit()
                    finally:
                        db.close()

                    # update local tracking
                    manager.remove_viewer_local(channel, user_id)

                await manager.broadcast(channel, {"event": "user_left", "user_id": user_id})
                count = manager.get_local_count(channel)
                await manager.broadcast(channel, {"event": "viewer_count_update", "count": count})

            # ---------- CHAT (real-time only, no DB persist) ----------
            elif action == "chat":
                user_id = data.get("user_id")
                user_name = data.get("user_name", "")
                message_text = (data.get("message") or "").strip()
                if not message_text:
                    continue

                # broadcast chat to all clients in channel (no DB write)
                await manager.broadcast(channel, {
                    "event": "chat",
                    "user_id": user_id,
                    "user_name": user_name,
                    "message": message_text,
                    "ts": datetime.utcnow().isoformat()
                })

            # ---------- LIVE END (host triggers) ----------
            elif action == "live_end":
                # mark live ended in DB (AstrologerDetail)
                db: Session = SessionLocal()
                try:
                    astro = db.query(AstrologerDetail).filter(AstrologerDetail.liveChannel == channel).first()
                    if astro:
                        astro.isLive = False
                        astro.liveChannel = None
                        astro.liveStartedAt = None
                        db.add(astro)
                        db.commit()

                    # mark all live viewers left_at (optional)
                    db.query(LiveViewer).filter(LiveViewer.live_channel == channel, LiveViewer.left_at.is_(None)).update({"left_at": datetime.utcnow()})
                    db.commit()
                finally:
                    db.close()

                # broadcast live ended
                await manager.broadcast(channel, {"event": "live_ended", "channel": channel})
                # clear local viewer set for this channel
                manager.channel_viewers.pop(channel, None)

            else:
                # unknown action — ignore or log
                pass

    except WebSocketDisconnect:
        # on disconnect we do NOT update DB.left_at (per your choice B),
        # but we remove from local set and broadcast updated viewer count.
        if current_viewer_id:
            manager.remove_viewer_local(channel, current_viewer_id)
            count = manager.get_local_count(channel)
            # best-effort broadcast
            await manager.broadcast(channel, {"event": "viewer_count_update", "count": count})
        manager.disconnect(channel, websocket)
    except Exception:
        # ensure cleanup on error
        manager.disconnect(channel, websocket)
