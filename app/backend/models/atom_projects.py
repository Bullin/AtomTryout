from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Atom_projects(Base):
    __tablename__ = "atom_projects"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)
    project_key = Column(String, nullable=False)
    name = Column(String, nullable=False)
    requirement = Column(String, nullable=True)
    app_type = Column(String, nullable=True)
    status = Column(String, nullable=True)
    building_at = Column(Integer, nullable=True)
    revisions = Column(String, nullable=True)
    versions = Column(String, nullable=True)
    active_ver = Column(Integer, nullable=True)
    client_created_at = Column(Integer, nullable=True)
    client_updated_at = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)