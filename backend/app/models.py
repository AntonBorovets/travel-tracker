from sqlalchemy import Column, String, Float, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class WishlistItem(Base):
    __tablename__ = "wishlist"

    fsq_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    address = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    photo_url = Column(String, nullable=True)
    rating = Column(Float, nullable=True)
    data_json = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class PlacesCache(Base):
    __tablename__ = "cache"

    cache_key = Column(String, primary_key=True, index=True)
    data_json = Column(Text, nullable=False)
    expires_at = Column(DateTime, nullable=False)