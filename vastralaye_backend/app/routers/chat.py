from sqlalchemy import or_, and_


from fastapi import (
    APIRouter, Depends, Query, HTTPException,
    WebSocket, WebSocketDisconnect
)
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Dict, Set
import json

from app.models.enums import SessionType, SessionStatus
from app.models.models import User, ChatRoom, ChatMessage, india_tz, AstrologerDetail, SessionRequest
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatMessageOut,
    ChatMessageCreate,
    LastMessageOut,
)
from app.utils.authenticate import get_current_user
from app.utils.database import get_db, SessionLocal

router = APIRouter()

# ============================================================
# WebSocket Connection Manager
# ============================================================
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(room_id, set()).add(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, room_id: str, payload: dict):
        for ws in list(self.active_connections.get(room_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(room_id, ws)

manager = ConnectionManager()

# ============================================================
# Helper: derive sender/receiver from JWT + room
# ============================================================
def resolve_sender_receiver(room: ChatRoom, current_user: User):
    if current_user.id == room.customer_user_id:
        return room.customer_user_id, room.astrologer_user_id

    if current_user.id == room.astrologer_user_id:
        return room.astrologer_user_id, room.customer_user_id

    raise HTTPException(status_code=403, detail="Not part of this chat")



# ============================================================
# GET CHAT HISTORY
# ============================================================
@router.get("/history/{other_user_id}", response_model=ChatHistoryResponse)
def get_chat_history(
    other_user_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = (
        db.query(ChatRoom)
        .filter(
            or_(
                and_(
                    ChatRoom.customer_user_id == current_user.id,
                    ChatRoom.astrologer_user_id == other_user_id,
                ),
                and_(
                    ChatRoom.customer_user_id == other_user_id,
                    ChatRoom.astrologer_user_id == current_user.id,
                ),
            )
        )
        .first()
    )

    if not room:
        return ChatHistoryResponse(messages=[], page=page, size=size, total=0)

    total = db.query(func.count(ChatMessage.id))\
        .filter(ChatMessage.room_id == room.id)\
        .scalar() or 0

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == room.id)
        .order_by(ChatMessage.created_at.asc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return ChatHistoryResponse(
        messages=messages,
        page=page,
        size=size,
        total=total,
    )



# ============================================================
# GET LAST MESSAGE
# ============================================================
@router.get("/last_message/{room_id}/last", response_model=LastMessageOut)
def get_last_message(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")

    if current_user.id not in [room.user_id, room.astrologer_id]:
        raise HTTPException(status_code=403, detail="Not allowed")

    msg = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at.desc())
        .first()
    )

    if not msg:
        raise HTTPException(status_code=404, detail="No messages found")

    return LastMessageOut(
        id=msg.id,
        room_id=msg.room_id,
        sender_user_id=msg.sender_user_id,
        receiver_user_id=msg.receiver_user_id,
        content=msg.content,
        created_at=msg.created_at,
        is_read=msg.is_read,
    )

# ============================================================
# MARK AS READ
# ============================================================
@router.post("/last_read/{room_id}/read")
def mark_as_read(
    room_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.room_id == room_id,
            ChatMessage.receiver_user_id == current_user.id,
            ChatMessage.is_read == False,
        )
        .update({ChatMessage.is_read: True}, synchronize_session=False)
    )
    db.commit()
    return {"marked_read": updated}

# ============================================================
# SEND MESSAGE (REST) — NO 403, BACKEND DECIDES SENDER
# ============================================================
@router.post("/send", response_model=ChatMessageOut)
async def send_message(
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = db.query(ChatRoom).filter(ChatRoom.id == payload.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")

    room_key = str(room.id)  # 🔥 SAME KEY

    sender_id, receiver_id = resolve_sender_receiver(room, current_user)

    if not payload.content:
        raise HTTPException(status_code=400, detail="Message content required")

    msg = ChatMessage(
        room_id=room_key,  # 🔥 FIX
        sender_user_id=sender_id,
        receiver_user_id=receiver_id,
        content=payload.content,
        meta_data=payload.metadata,
        created_at=datetime.now(india_tz),
        is_read=False,
    )

    db.add(msg)
    db.commit()
    db.refresh(msg)

    out = ChatMessageOut.model_validate(msg).dict()

    await manager.broadcast(room_key, {
        "type": "message",
        "message": out
    })

    return msg



# @router.post("/send", response_model=ChatMessageOut)
# async def send_message(
#     payload: ChatMessageCreate,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     room = db.query(ChatRoom).filter(ChatRoom.id == payload.room_id).first()
#     if not room:
#         raise HTTPException(status_code=404, detail="Chat room not found")
#
#     sender_id, receiver_id = resolve_sender_receiver(room, current_user)
#
#     if not payload.content:
#         raise HTTPException(status_code=400, detail="Message content required")
#
#     msg = ChatMessage(
#         room_id=room.id,
#         sender_user_id=sender_id,
#         receiver_user_id=receiver_id,
#         content=payload.content,
#         meta_data=payload.metadata,
#         created_at=datetime.now(india_tz),
#         is_read=False,
#     )
#
#     db.add(msg)
#     db.commit()
#     db.refresh(msg)
#
#     out = ChatMessageOut.model_validate(msg).dict()
#     await manager.broadcast(room.id, {"type": "message", "message": out})
#
#     return msg


# ============================================================
# WEBSOCKET (JWT-SECURED)
# Connect with: /chat/ws/{room_id}?token=JWT
# ============================================================

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    db = SessionLocal()
    room_key = None

    try:
        # 🔐 Authenticate user
        current_user = get_current_user(token=token, db=db)

        room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
        if not room:
            await websocket.close(code=1008)
            return

        # ✅ SAME room_key for everyone
        room_key = str(room.id)

        # 🔒 Membership check
        if current_user.id not in [room.customer_user_id, room.astrologer_user_id]:
            await websocket.close(code=1008)
            return

        # 🔗 Connect
        await manager.connect(room_key, websocket)
        # print(f"✅ WS Connected | Room: {room_key} | User: {current_user.id}")

        while True:
            data = await websocket.receive_json()

            content = data.get("content")
            if not content:
                continue

            sender_id, receiver_id = resolve_sender_receiver(room, current_user)

            msg = ChatMessage(
                room_id=room_key,
                sender_user_id=sender_id,
                receiver_user_id=receiver_id,
                content=content,
                meta_data=data.get("metadata"),
                created_at=datetime.now(india_tz),
                is_read=False,
            )

            db.add(msg)
            db.commit()
            db.refresh(msg)

            payload = {
                "type": "message",
                "message": {
                    "id": msg.id,
                    "room_id": msg.room_id,
                    "sender_user_id": msg.sender_user_id,
                    "receiver_user_id": msg.receiver_user_id,
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat(),
                }
            }

            # print(f"📤 Broadcasting to room {room_key}")
            await manager.broadcast(room_key, payload)

    except WebSocketDisconnect:
        # print(f"❌ WS Disconnected | Room: {room_key}")
        if room_key:
            manager.disconnect(room_key, websocket)

    except Exception as e:
        return None
        # print("❌ WS ERROR:", e)


    finally:
        db.close()


# @router.websocket("/ws/{room_id}")
# async def websocket_endpoint(websocket: WebSocket, room_id: str):
#     token = websocket.query_params.get("token")
#     if not token:
#         await websocket.close(code=1008)
#         return
#
#     db = SessionLocal()
#     try:
#         current_user = get_current_user(token=token, db=db)
#         room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
#         if not room:
#             await websocket.close(code=1008)
#             return
#
#         # ✅ FIXED MEMBERSHIP CHECK
#         if current_user.id not in [room.customer_user_id, room.astrologer_user_id]:
#             await websocket.close(code=1008)
#             return
#
#         await manager.connect(room_id, websocket)
#
#         while True:
#             data = await websocket.receive_json()
#             content = data.get("content")
#
#             if not content:
#                 continue  # prevent NULL insert
#
#             sender_id, receiver_id = resolve_sender_receiver(room, current_user)
#
#             msg = ChatMessage(
#                 room_id=room_id,
#                 sender_user_id=sender_id,
#                 receiver_user_id=receiver_id,
#                 content=content,
#                 meta_data=data.get("metadata"),
#                 created_at=datetime.now(india_tz),
#                 is_read=False,
#             )
#
#             db.add(msg)
#             db.commit()
#             db.refresh(msg)
#
#             out = ChatMessageOut.model_validate(msg).dict()
#             await manager.broadcast(room_id, {"type": "message", "message": out})
#
#     except WebSocketDisconnect:
#         manager.disconnect(room_id, websocket)
#     finally:
#         db.close()


@router.post("/create-session")
def create_session_request(
    astrologer_id: str,
    session_type: SessionType,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_id = current_user.id

    # ✅ Find astrologer detail
    astro = (
        db.query(AstrologerDetail)
        .filter(AstrologerDetail.astro_id == astrologer_id)
        .first()
    )
    if not astro:
        raise HTTPException(404, "Astrologer not found")

    # ✅ Find chat room using NEW columns
    room = (
        db.query(ChatRoom)
        .filter(
            ChatRoom.customer_user_id == user_id,
            ChatRoom.astrologer_user_id == astro.user_id
        )
        .first()
    )

    if not room:
        raise HTTPException(404, "Chat room not found")

    # ✅ Create session request
    session = SessionRequest(
        room_id=room.id,
        user_id=user_id,
        astrologer_id=astro.astro_id,
        session_type=session_type,
        status=SessionStatus.pending
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "message": "Session request created",
        "session_id": session.id
    }


