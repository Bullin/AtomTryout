import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.atom_projects import Atom_projectsService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/atom_projects", tags=["atom_projects"])


# ---------- Pydantic Schemas ----------
class Atom_projectsData(BaseModel):
    """Entity data schema (for create/update)"""
    project_key: str
    name: str
    requirement: str = None
    app_type: str = None
    status: str = None
    building_at: int = None
    revisions: str = None
    versions: str = None
    active_ver: int = None
    client_created_at: int = None
    client_updated_at: int = None


class Atom_projectsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    project_key: Optional[str] = None
    name: Optional[str] = None
    requirement: Optional[str] = None
    app_type: Optional[str] = None
    status: Optional[str] = None
    building_at: Optional[int] = None
    revisions: Optional[str] = None
    versions: Optional[str] = None
    active_ver: Optional[int] = None
    client_created_at: Optional[int] = None
    client_updated_at: Optional[int] = None


class Atom_projectsResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    project_key: str
    name: str
    requirement: Optional[str] = None
    app_type: Optional[str] = None
    status: Optional[str] = None
    building_at: Optional[int] = None
    revisions: Optional[str] = None
    versions: Optional[str] = None
    active_ver: Optional[int] = None
    client_created_at: Optional[int] = None
    client_updated_at: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Atom_projectsListResponse(BaseModel):
    """List response schema"""
    items: List[Atom_projectsResponse]
    total: int
    skip: int
    limit: int


class Atom_projectsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Atom_projectsData]


class Atom_projectsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Atom_projectsUpdateData


class Atom_projectsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Atom_projectsBatchUpdateItem]


class Atom_projectsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Atom_projectsListResponse)
async def query_atom_projectss(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query atom_projectss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying atom_projectss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Atom_projectsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} atom_projectss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid atom_projects query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying atom_projectss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Atom_projectsListResponse)
async def query_atom_projectss_all(
    query: str = Query(None, description='Query conditions as JSON, e.g. {"id":2} or {"id":{"$gte":2}}'),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query atom_projectss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying atom_projectss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Atom_projectsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} atom_projectss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid atom_projects query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying atom_projectss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Atom_projectsResponse)
async def get_atom_projects(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single atom_projects by ID (user can only see their own records)"""
    logger.debug(f"Fetching atom_projects with id: {id}, fields={fields}")
    
    service = Atom_projectsService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Atom_projects with id {id} not found")
            raise HTTPException(status_code=404, detail="Atom_projects not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching atom_projects {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Atom_projectsResponse, status_code=201)
async def create_atom_projects(
    data: Atom_projectsData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new atom_projects"""
    logger.debug(f"Creating new atom_projects with data: {data}")
    
    service = Atom_projectsService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create atom_projects")
        
        logger.info(f"Atom_projects created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating atom_projects: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating atom_projects: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Atom_projectsResponse], status_code=201)
async def create_atom_projectss_batch(
    request: Atom_projectsBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple atom_projectss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} atom_projectss")
    
    service = Atom_projectsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} atom_projectss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Atom_projectsResponse])
async def update_atom_projectss_batch(
    request: Atom_projectsBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple atom_projectss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} atom_projectss")
    
    service = Atom_projectsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} atom_projectss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Atom_projectsResponse)
async def update_atom_projects(
    id: int,
    data: Atom_projectsUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing atom_projects (requires ownership)"""
    logger.debug(f"Updating atom_projects {id} with data: {data}")

    service = Atom_projectsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Atom_projects with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Atom_projects not found")
        
        logger.info(f"Atom_projects {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating atom_projects {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating atom_projects {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_atom_projectss_batch(
    request: Atom_projectsBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple atom_projectss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} atom_projectss")
    
    service = Atom_projectsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} atom_projectss successfully")
        return {"message": f"Successfully deleted {deleted_count} atom_projectss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_atom_projects(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single atom_projects by ID (requires ownership)"""
    logger.debug(f"Deleting atom_projects with id: {id}")
    
    service = Atom_projectsService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Atom_projects with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Atom_projects not found")
        
        logger.info(f"Atom_projects {id} deleted successfully")
        return {"message": "Atom_projects deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting atom_projects {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")