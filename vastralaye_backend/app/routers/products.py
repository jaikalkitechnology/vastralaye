from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import Category, SubCategory, Product, ProductReview
from app.schemas.products import CategoryResponse, CategoryWithSubcategories, SubCategoryResponse, \
    SubCategoryWithCategory, ProductListResponse, PaginatedResponse, ProductResponse, ProductReviewWithReplies, \
    ProductReviewResponse, ProductReviewCreate

router = APIRouter(prefix="/api/v1/fronted/products", tags=['FrontedProducts'])

# A category is storefront-visible unless explicitly hidden. NULL rows
# predate the is_active column (schema_sync adds it NULLable on live
# databases) and must stay visible, so `== True` alone would be wrong.
CATEGORY_VISIBLE = or_(Category.is_active == True, Category.is_active.is_(None))


# ==================== Category Routes ====================

@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(
        db: Session = Depends(get_db),
        include_inactive: bool = False
):
    """
    List all categories

    - **include_inactive**: Include inactive categories (default: False)
    """
    try:
        query = db.query(Category)

        # Hidden categories stay off the storefront. NULL means the row
        # predates the is_active column — visible, only False hides.
        if not include_inactive:
            query = query.filter(CATEGORY_VISIBLE)

        categories = query.order_by(Category.name).all()
        return categories
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch categories: {str(e)}"
        )


@router.get("/categories/with-subcategories", response_model=List[CategoryWithSubcategories])
async def list_categories_with_subcategories(db: Session = Depends(get_db)):
    """
    List all categories with their subcategories
    """
    try:
        categories = db.query(Category).options(
            joinedload(Category.subcategories)
        ).filter(CATEGORY_VISIBLE).order_by(Category.name).all()
        return categories
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch categories: {str(e)}"
        )


@router.get("/categories/{category_id}", response_model=CategoryWithSubcategories)
async def get_category(category_id: int, db: Session = Depends(get_db)):
    """
    Get a specific category by ID with its subcategories
    """
    try:
        category = db.query(Category).options(
            joinedload(Category.subcategories)
        ).filter(Category.id == category_id).first()

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with id {category_id} not found"
            )

        return category
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch category: {str(e)}"
        )


@router.get("/categories/slug/{slug}", response_model=CategoryWithSubcategories)
async def get_category_by_slug(slug: str, db: Session = Depends(get_db)):
    """
    Get a specific category by slug with its subcategories
    """
    try:
        # Hidden categories 404 by slug too — hiding covers a direct link.
        category = db.query(Category).options(
            joinedload(Category.subcategories)
        ).filter(Category.slug == slug, CATEGORY_VISIBLE).first()

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with slug '{slug}' not found"
            )

        return category
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch category: {str(e)}"
        )


# ==================== SubCategory Routes ====================

@router.get("/subcategories", response_model=List[SubCategoryResponse])
async def list_subcategories(
        category_id: Optional[int] = Query(None, description="Filter by category ID"),
        db: Session = Depends(get_db)
):
    """
    List all subcategories, optionally filtered by category

    - **category_id**: Optional filter by parent category ID
    """
    try:
        query = db.query(SubCategory)

        if category_id:
            query = query.filter(SubCategory.category_id == category_id)

        subcategories = query.order_by(SubCategory.name).all()
        return subcategories
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch subcategories: {str(e)}"
        )


@router.get("/subcategories/{subcategory_id}", response_model=SubCategoryWithCategory)
async def get_subcategory(subcategory_id: int, db: Session = Depends(get_db)):
    """
    Get a specific subcategory by ID with its parent category
    """
    try:
        subcategory = db.query(SubCategory).options(
            joinedload(SubCategory.category)
        ).filter(SubCategory.id == subcategory_id).first()

        if not subcategory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Subcategory with id {subcategory_id} not found"
            )

        return subcategory
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch subcategory: {str(e)}"
        )


@router.get("/subcategories/slug/{slug}", response_model=SubCategoryWithCategory)
async def get_subcategory_by_slug(slug: str, db: Session = Depends(get_db)):
    """
    Get a specific subcategory by slug with its parent category
    """
    try:
        subcategory = db.query(SubCategory).options(
            joinedload(SubCategory.category)
        ).filter(SubCategory.slug == slug).first()

        if not subcategory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Subcategory with slug '{slug}' not found"
            )

        return subcategory
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch subcategory: {str(e)}"
        )


# ==================== Product Routes ====================

@router.get("/products", response_model=List[ProductListResponse])
async def list_products(
        category_id: Optional[int] = Query(None, description="Filter by category ID"),
        subcategory_id: Optional[int] = Query(None, description="Filter by subcategory ID"),
        search: Optional[str] = Query(None, description="Search in name, description, and tags"),
        min_price: Optional[float] = Query(None, description="Minimum price filter"),
        max_price: Optional[float] = Query(None, description="Maximum price filter"),
        in_stock: Optional[bool] = Query(None, description="Filter by stock availability"),
        featured: Optional[bool] = Query(None, description="Filter featured products"),
        best_seller: Optional[bool] = Query(None, description="Filter best sellers"),
        new_arrival: Optional[bool] = Query(None, description="Filter new arrivals"),
        sort_by: str = Query("featured", description="Sort by: featured, newest, price_asc, price_desc, rating"),
        db: Session = Depends(get_db)
):
    """
    List products with optional filters and sorting

    **Filters:**
    - category_id, subcategory_id: Filter by category
    - search: Search in product name and description
    - min_price, max_price: Price range filter
    - in_stock, featured, best_seller, new_arrival: Boolean filters

    **Sorting:**
    - featured: Default order
    - newest: Most recent first
    - price_asc: Price low to high
    - price_desc: Price high to low
    - rating: Highest rated first
    """
    try:
        query = db.query(Product).filter(Product.is_active == True)

        # Apply filters
        if subcategory_id:
            query = query.filter(Product.subcategory_id == subcategory_id)
        elif category_id:
            query = query.filter(Product.category_id == category_id)

        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    func.lower(Product.name).like(search_term),
                    func.lower(Product.description).like(search_term),
                )
            )

        if min_price is not None:
            query = query.filter(
                or_(
                    and_(Product.discount_price.isnot(None), Product.discount_price >= min_price),
                    and_(Product.discount_price.is_(None), Product.price >= min_price)
                )
            )

        if max_price is not None:
            query = query.filter(
                or_(
                    and_(Product.discount_price.isnot(None), Product.discount_price <= max_price),
                    and_(Product.discount_price.is_(None), Product.price <= max_price)
                )
            )

        if in_stock is not None:
            query = query.filter(Product.in_stock == in_stock)

        if featured is not None:
            query = query.filter(Product.featured == featured)

        if best_seller is not None:
            query = query.filter(Product.best_seller == best_seller)

        if new_arrival is not None:
            query = query.filter(Product.new_arrival == new_arrival)

        # Apply sorting
        if sort_by == "newest":
            query = query.order_by(Product.created_at.desc())
        elif sort_by == "price_asc":
            # Sort by discount_price if available, otherwise by price
            query = query.order_by(
                func.coalesce(Product.discount_price, Product.price).asc()
            )
        elif sort_by == "price_desc":
            query = query.order_by(
                func.coalesce(Product.discount_price, Product.price).desc()
            )
        elif sort_by == "rating":
            query = query.order_by(Product.rating.desc())
        else:  # featured or default
            query = query.order_by(
                Product.featured.desc(),
                Product.best_seller.desc(),
                Product.new_arrival.desc(),
                Product.created_at.desc()
            )

        products = query.all()

        # Convert to ProductListResponse with frontend-friendly field names
        return [ProductListResponse.from_product(p) for p in products]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch products: {str(e)}"
        )


@router.get("/products/paginated", response_model=PaginatedResponse)
async def list_products_paginated(
        category_id: Optional[int] = Query(None),
        subcategory_id: Optional[int] = Query(None),
        search: Optional[str] = Query(None),
        min_price: Optional[float] = Query(None),
        max_price: Optional[float] = Query(None),
        in_stock: Optional[bool] = Query(None),
        featured: Optional[bool] = Query(None),
        best_seller: Optional[bool] = Query(None),
        new_arrival: Optional[bool] = Query(None),
        sort_by: str = Query("featured"),
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),
        db: Session = Depends(get_db)
):
    """
    List products with pagination and filters (alternative endpoint for large datasets)
    """
    try:
        # Build base query (same as list_products)
        query = db.query(Product).filter(Product.is_active == True)

        # Apply all filters (same logic as above)
        if subcategory_id:
            query = query.filter(Product.subcategory_id == subcategory_id)
        elif category_id:
            query = query.filter(Product.category_id == category_id)

        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    func.lower(Product.name).like(search_term),
                    func.lower(Product.description).like(search_term),
                )
            )

        if min_price is not None:
            query = query.filter(
                or_(
                    and_(Product.discount_price.isnot(None), Product.discount_price >= min_price),
                    and_(Product.discount_price.is_(None), Product.price >= min_price)
                )
            )

        if max_price is not None:
            query = query.filter(
                or_(
                    and_(Product.discount_price.isnot(None), Product.discount_price <= max_price),
                    and_(Product.discount_price.is_(None), Product.price <= max_price)
                )
            )

        if in_stock is not None:
            query = query.filter(Product.in_stock == in_stock)

        if featured is not None:
            query = query.filter(Product.featured == featured)

        if best_seller is not None:
            query = query.filter(Product.best_seller == best_seller)

        if new_arrival is not None:
            query = query.filter(Product.new_arrival == new_arrival)

        # Get total count before pagination
        total = query.count()

        # Apply sorting
        if sort_by == "newest":
            query = query.order_by(Product.created_at.desc())
        elif sort_by == "price_asc":
            query = query.order_by(func.coalesce(Product.discount_price, Product.price).asc())
        elif sort_by == "price_desc":
            query = query.order_by(func.coalesce(Product.discount_price, Product.price).desc())
        elif sort_by == "rating":
            query = query.order_by(Product.rating.desc())
        else:
            query = query.order_by(
                Product.featured.desc(),
                Product.best_seller.desc(),
                Product.new_arrival.desc(),
                Product.created_at.desc()
            )

        # Apply pagination
        offset = (page - 1) * page_size
        products = query.offset(offset).limit(page_size).all()

        total_pages = (total + page_size - 1) // page_size

        return PaginatedResponse(
            items=[ProductListResponse.from_product(p) for p in products],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch products: {str(e)}"
        )


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Get a specific product by ID with full details
    """
    try:
        # Hidden products (is_active False) 404 here too — hiding must cover
        # a direct /product/<id> link, not just the listings.
        product = db.query(Product).options(
            joinedload(Product.category),
            joinedload(Product.subcategory)
        ).filter(Product.id == product_id, Product.is_active == True).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {product_id} not found"
            )

        return product
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch product: {str(e)}"
        )


# ==================== Product Review Routes ====================

@router.get("/products/{product_id}/reviews", response_model=List[ProductReviewWithReplies])
async def get_product_reviews(
        product_id: int,
        db: Session = Depends(get_db)
):
    """
    Get all reviews for a specific product
    """
    try:
        # Verify product exists
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {product_id} not found"
            )

        reviews = db.query(ProductReview).options(
            joinedload(ProductReview.replies)
        ).filter(
            ProductReview.product_id == product_id
        ).order_by(ProductReview.created_at.desc()).all()

        return reviews
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch reviews: {str(e)}"
        )


@router.post("/products/{product_id}/reviews", response_model=ProductReviewResponse,
             status_code=status.HTTP_201_CREATED)
async def create_product_review(
        product_id: int,
        review: ProductReviewCreate,
        user_id: int = Query(..., description="User ID (from authentication)"),
        db: Session = Depends(get_db)
):
    """
    Create a new review for a product

    Note: In production, user_id should come from the authenticated session
    """
    try:
        # Verify product exists
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {product_id} not found"
            )

        # Create review
        db_review = ProductReview(
            product_id=product_id,
            user_id=user_id,
            name=review.name,
            email=review.email,
            rating=review.rating,
            comment=review.comment
        )

        db.add(db_review)
        db.commit()
        db.refresh(db_review)

        # Update product rating and review count
        reviews = db.query(ProductReview).filter(ProductReview.product_id == product_id).all()
        avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 0
        product.rating = round(avg_rating, 1)
        product.reviews = len(reviews)
        db.commit()

        return db_review
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create review: {str(e)}"
        )