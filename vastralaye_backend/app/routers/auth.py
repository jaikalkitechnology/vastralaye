# from fastapi import Depends, HTTPException, status
# from app.utils.authenticate import get_current_user
#
# def admin_required(user=Depends(get_current_user)):
#     if user.role != "admin":
#         raise HTTPException(status_code=403, detail="Access denied. Admins only")
#     return user
