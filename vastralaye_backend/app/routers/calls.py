import uuid
from fastapi import APIRouter, Depends, HTTPException,status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta,timezone
from app.utils.authenticate import get_current_user
from app.utils.database import get_db
from app.models.models import (
    SessionRequest,
    SessionStatus,
    ChatRoom,
    User,
    AstrologerDetail,
)
from app.schemas.calls import (
    CreateSessionRequest,
    SessionRequestResponse,
    UpdateSessionStatus,SessionTimerResponse,RequestTimeStateResponse
)
from app.models.notification import Notification
from app.utils.ws_manager import manager

router = APIRouter()

# =========================================================
# USER CREATES SESSION REQUEST (chat / audio / video)
# =========================================================
@router.post("/create", response_model=SessionRequestResponse)
def create_session_request(
    data: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1️⃣ Only customer can create session
    if current_user.role != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can create session requests"
        )

    # 2️⃣ Get astrologer profile
    astro = (
        db.query(AstrologerDetail)
        .filter(AstrologerDetail.astro_id == data.astrologer_id)
        .first()
    )
    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    # 🔴 CRITICAL CHECK (THIS FIXES YOUR ERROR)
    if not astro.user_id:
        raise HTTPException(
            status_code=400,
            detail="Astrologer user account not linked"
        )

    # 🔴 Extra safety (no self-chat)
    if astro.user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Customer and astrologer cannot be same user"
        )

    # 3️⃣ Find existing room
    room = (
        db.query(ChatRoom)
        .filter(
            ChatRoom.customer_user_id == current_user.id,
            ChatRoom.astrologer_user_id == astro.user_id,
        )
        .first()
    )

    # 4️⃣ Create or update room
    if not room:
        room = ChatRoom(
            id=f"room_{uuid.uuid4().hex}",
            customer_user_id=current_user.id,
            astrologer_user_id=astro.user_id,  # ✅ NEVER NULL NOW
            astrologer_id=astro.astro_id,
            current_session_type=data.session_type,
            current_session_status=SessionStatus.pending,
        )
        db.add(room)
        db.flush()
    else:
        room.current_session_type = data.session_type
        room.current_session_status = SessionStatus.pending

    # 5️⃣ Create session request
    req = SessionRequest(
        room_id=room.id,
        user_id=current_user.id,
        astrologer_id=astro.astro_id,
        session_type=data.session_type,
        status=SessionStatus.pending,
    )

    db.add(req)
    db.commit()
    db.refresh(req)

    return req


# =========================================================
# ASTROLOGER FETCHES ALL REQUESTS
# =========================================================
# @router.get(
#     "/astrologer/{astrologer_id}",
#     response_model=list[SessionRequestResponse]
# )
# def get_requests_for_astrologer(
#     astrologer_id: str,
#     db: Session = Depends(get_db),
# ):
#     return (
#         db.query(SessionRequest)
#         .options(joinedload(SessionRequest.user))
#         .filter(SessionRequest.astrologer_id == astrologer_id)
#         .order_by(SessionRequest.created_at.desc())
#         .all()
#     )



# update

@router.get(
    "/astrologer/{astrologer_id}",
    response_model=list[SessionRequestResponse]
)
def get_requests_for_astrologer(
        astrologer_id: str,
        db: Session = Depends(get_db),
):
    # 1. Fetch the requests from Database
    requests = (
        db.query(SessionRequest)
        .options(joinedload(SessionRequest.user))
        .filter(SessionRequest.astrologer_id == astrologer_id)
        .order_by(SessionRequest.created_at.desc())
        .all()
    )

    # 2. Define the timeout limit (10 minutes)
    timeout_limit = timedelta(minutes=10)

    # Get current time (Ensure this matches your DB timezone, usually UTC)
    now = datetime.utcnow()

    # 3. Iterate through results and update status on the fly
    for req in requests:
        # We only want to expire requests that are still PENDING.
        # If they are already Accepted/Rejected, we usually leave them alone.
        if req.status == "PENDING":

            # Check time difference
            if req.created_at and (now - req.created_at) > timeout_limit:
                req.status = "ENDED"  # Or "EXPIRED" based on your Enum/String

                # Optional: If you want to permanently save this status
                # to the database, uncomment the next line:
                # db.commit()

    return requests


#timer

@router.get("/session-request/{request_id}/start-timer")
def start_and_get_timer(
    request_id: int,
    db: Session = Depends(get_db)
):
    try:
        # 1. Fetch Session Request
        session_req = (
            db.query(SessionRequest)
            .filter(SessionRequest.id == request_id)
            .first()
        )

        if not session_req:
            raise HTTPException(
                status_code=404,
                detail=f"Session Request ID {request_id} not found"
            )

        # 2. Normalize status safely
        current_status = (
            session_req.status.value
            if hasattr(session_req.status, "value")
            else session_req.status
        )
        current_status = str(current_status).upper()

        # 3. Timer config
        TIMEOUT_MINUTES = 10
        limit = timedelta(minutes=TIMEOUT_MINUTES)
        full_seconds = int(limit.total_seconds())

        # 4. Current time (UTC)
        now = datetime.now(timezone.utc)

        # --------------------------------------------------
        # SCENARIO A: PENDING
        # --------------------------------------------------
        if current_status == "PENDING":
            return {
                "request_id": session_req.id,
                "status": "PENDING",
                "remaining_seconds": full_seconds,
                "is_expired": False,
                "message": "Timer waits for ACCEPTED status"
            }

        # --------------------------------------------------
        # SCENARIO B: ACCEPTED → Start timer if not started
        # --------------------------------------------------
        if current_status == "ACCEPTED" and session_req.start_time is None:
            session_req.start_time = now.replace(tzinfo=None)
            db.commit()
            db.refresh(session_req)

        start_time = session_req.start_time

        # If start_time still missing → session already ended
        if not start_time:
            return {
                "request_id": session_req.id,
                "status": current_status,
                "remaining_seconds": 0,
                "is_expired": True
            }

        # Ensure UTC
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)

        # Calculate remaining time
        end_time = start_time + limit
        remaining_seconds = int((end_time - now).total_seconds())

        is_expired = False

        # --------------------------------------------------
        # SCENARIO C: EXPIRED
        # --------------------------------------------------
        if remaining_seconds <= 0:
            remaining_seconds = 0
            is_expired = True

            if current_status == "ACCEPTED":
                session_req.status = "COMPLETED"
                db.commit()
                current_status = "COMPLETED"

        return {
            "request_id": session_req.id,
            "status": current_status,
            "remaining_seconds": remaining_seconds,
            "is_expired": is_expired
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error: {str(e)}"
        )

# =========================================================
# ASTROLOGER ACCEPT / DECLINE
# =========================================================
@router.patch("/res_accept/{request_id}", response_model=SessionRequestResponse)
async def respond_request(
    request_id: int,
    data: UpdateSessionStatus,
    db: Session = Depends(get_db),
):
    request = (
        db.query(SessionRequest)
        .options(joinedload(SessionRequest.user))
        .filter(SessionRequest.id == request_id)
        .first()
    )

    if not request:
        raise HTTPException(404, "Request not found")

    if request.status != SessionStatus.pending:
        raise HTTPException(400, "Request already responded")

    # 🔄 Update status
    request.status = data.status
    db.commit()
    db.refresh(request)

    # 🔔 Notify user
    msg = f"Your {request.session_type.value} request was {request.status.value}"

    notification = Notification(
        recipient_id=request.user_id,
        recipient_role="user",
        title="Session Request Update",
        body=msg,
        screen="session_status",
        data={
            "request_id": request.id,
            "status": request.status.value,
        },
        fcm_token=request.user.fcm_token if request.user else None,
        is_sent=False,
    )

    db.add(notification)
    db.commit()

    # 📡 WebSocket push
    await manager.send_personal_message(request.user_id, msg)

    return request
