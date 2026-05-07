import json
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional

from app.database import get_db
from app.models import WishlistItem, PlacesCache
from app.config import settings

router = APIRouter()

GEO_BASE_URL = "https://api.geoapify.com/v2"
GEO_PLACES_URL = "https://api.geoapify.com/v2/places"
GEO_GEOCODE_URL = "https://api.geoapify.com/v1/geocode/search"

# ─── CACHE HELPERS ────────────────────────────────────────────────

async def get_cache(db: AsyncSession, key: str):
    result = await db.execute(
        select(PlacesCache).where(PlacesCache.cache_key == key)
    )
    cached = result.scalar_one_or_none()
    if not cached:
        return None
    if cached.expires_at < datetime.utcnow():
        await db.execute(delete(PlacesCache).where(PlacesCache.cache_key == key))
        await db.commit()
        return None
    return json.loads(cached.data_json)

async def set_cache(db: AsyncSession, key: str, data: dict):
    expires_at = datetime.utcnow() + timedelta(minutes=settings.cache_ttl_minutes)
    existing = await db.execute(
        select(PlacesCache).where(PlacesCache.cache_key == key)
    )
    cached = existing.scalar_one_or_none()
    if cached:
        cached.data_json = json.dumps(data)
        cached.expires_at = expires_at
    else:
        db.add(PlacesCache(
            cache_key=key,
            data_json=json.dumps(data),
            expires_at=expires_at
        ))
    await db.commit()

# ─── PLACES SEARCH ────────────────────────────────────────────────

@router.get("/places/search")
async def search_places(
    query: str = Query(..., description="Ключове слово пошуку"),
    lat: float = Query(..., description="Широта"),
    lng: float = Query(..., description="Довгота"),
    radius: int = Query(5000, description="Радіус пошуку в метрах"),
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db)
):
    cache_key = f"search:{query}:{lat:.4f}:{lng:.4f}:{radius}"
    cached = await get_cache(db, cache_key)
    if cached:
        return {"source": "cache", "results": cached}

    # Спочатку геокодуємо query щоб отримати категорії
    categories = _query_to_categories(query)

    async with httpx.AsyncClient() as client:
        response = await client.get(
            GEO_PLACES_URL,
            params={
                "categories": categories,
                "filter": f"circle:{lng},{lat},{radius}",
                "bias": f"proximity:{lng},{lat}",
                "limit": limit,
                "apiKey": settings.geoapify_api_key,
                "lang": "en"
            }
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Geoapify error: {response.text}"
        )

    raw = response.json()
    results = [_format_place(f) for f in raw.get("features", [])]
    await set_cache(db, cache_key, results)
    return {"source": "api", "results": results}


def _query_to_categories(query: str) -> str:
    """Мапимо текстовий запит на категорії Geoapify"""
    q = query.lower()
    mapping = {
        "restaurant": "catering.restaurant",
        "cafe": "catering.cafe",
        "coffee": "catering.cafe",
        "hotel": "accommodation.hotel",
        "museum": "entertainment.museum",
        "park": "leisure.park",
        "bar": "catering.bar",
        "beach": "beach",
        "airport": "airport",
        "hospital": "healthcare.hospital",
        "church": "religion",
        "mall": "commercial.shopping_mall",
        "shop": "commercial",
        "bank": "service.financial.bank",
        "pharmacy": "healthcare.pharmacy",
        "gym": "sport.fitness",
        "zoo": "entertainment.zoo",
        "cinema": "entertainment.cinema",
        "theatre": "entertainment.theatre",
        "bridge": "heritage.landmark",
        "tower": "heritage.landmark",
        "monument": "heritage.monument",
        "castle": "heritage.castle",
    }
    for keyword, category in mapping.items():
        if keyword in q:
            return category
    return "tourism.attraction"


def _format_place(feature: dict) -> dict:
    """Форматуємо відповідь Geoapify у зручний формат"""
    props = feature.get("properties", {})
    geo = feature.get("geometry", {})
    coords = geo.get("coordinates", [None, None])

    return {
        "place_id": props.get("place_id", ""),
        "name": props.get("name", props.get("address_line1", "Unknown")),
        "category": props.get("categories", [None])[0] if props.get("categories") else None,
        "address": props.get("formatted", ""),
        "lat": coords[1] if len(coords) > 1 else None,
        "lng": coords[0] if len(coords) > 0 else None,
        "distance": props.get("distance"),
        "city": props.get("city", ""),
        "country": props.get("country", ""),
        "website": props.get("website"),
        "phone": props.get("phone"),
        "opening_hours": props.get("opening_hours"),
        "rating": None,  # Geoapify не має рейтингів
        "photo_url": None,
    }

# ─── PLACE DETAILS ────────────────────────────────────────────────

@router.get("/places/{place_id:path}")
async def get_place_details(
    place_id: str,
    db: AsyncSession = Depends(get_db)
):
    cache_key = f"detail:{place_id}"
    cached = await get_cache(db, cache_key)
    if cached:
        return {"source": "cache", **cached}

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.geoapify.com/v2/place-details",
            params={
                "id": place_id,
                "apiKey": settings.geoapify_api_key,
                "features": "details,opening_hours,contact"
            }
        )

    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Place not found")

    raw = response.json()
    features = raw.get("features", [])
    if not features:
        raise HTTPException(status_code=404, detail="Place not found")

    result = _format_place(features[0])
    await set_cache(db, cache_key, result)
    return {"source": "api", **result}

# ─── GEOCODE (пошук координат за назвою міста) ───────────────────

@router.get("/geocode")
async def geocode(
    city: str = Query(..., description="Назва міста"),
    db: AsyncSession = Depends(get_db)
):
    cache_key = f"geocode:{city.lower()}"
    cached = await get_cache(db, cache_key)
    if cached:
        return {"source": "cache", **cached}

    async with httpx.AsyncClient() as client:
        response = await client.get(
            GEO_GEOCODE_URL,
            params={
                "text": city,
                "apiKey": settings.geoapify_api_key,
                "limit": 1,
                "type": "city"
            }
        )

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Geocoding failed")

    features = response.json().get("features", [])
    if not features:
        raise HTTPException(status_code=404, detail="City not found")

    props = features[0].get("properties", {})
    coords = features[0].get("geometry", {}).get("coordinates", [])

    result = {
        "city": props.get("city", city),
        "country": props.get("country", ""),
        "lat": coords[1] if len(coords) > 1 else None,
        "lng": coords[0] if len(coords) > 0 else None,
    }

    await set_cache(db, cache_key, result)
    return {"source": "api", **result}

# ─── WISHLIST ─────────────────────────────────────────────────────

@router.get("/wishlist")
async def get_wishlist(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WishlistItem))
    items = result.scalars().all()
    return [
        {
            "fsq_id": i.fsq_id,
            "name": i.name,
            "category": i.category,
            "address": i.address,
            "lat": i.lat,
            "lng": i.lng,
            "photo_url": i.photo_url,
            "rating": i.rating,
            "created_at": str(i.created_at)
        }
        for i in items
    ]

@router.post("/wishlist")
async def add_to_wishlist(
    fsq_id: str,
    name: str,
    category: Optional[str] = None,
    address: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    photo_url: Optional[str] = None,
    rating: Optional[float] = None,
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(
        select(WishlistItem).where(WishlistItem.fsq_id == fsq_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Місце вже є у wishlist")

    item = WishlistItem(
        fsq_id=fsq_id,
        name=name,
        category=category,
        address=address,
        lat=lat,
        lng=lng,
        photo_url=photo_url,
        rating=rating
    )
    db.add(item)
    await db.commit()
    return {"message": "Додано до wishlist", "fsq_id": fsq_id}

@router.delete("/wishlist/{fsq_id}")
async def remove_from_wishlist(fsq_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WishlistItem).where(WishlistItem.fsq_id == fsq_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Місце не знайдено у wishlist")

    await db.delete(item)
    await db.commit()
    return {"message": "Видалено з wishlist", "fsq_id": fsq_id}

@router.get("/wishlist/{fsq_id}/check")
async def check_wishlist(fsq_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WishlistItem).where(WishlistItem.fsq_id == fsq_id)
    )
    exists = result.scalar_one_or_none() is not None
    return {"fsq_id": fsq_id, "in_wishlist": exists}

# ─── HEALTH ───────────────────────────────────────────────────────

@router.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}