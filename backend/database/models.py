from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from werkzeug.security import generate_password_hash, check_password_hash

import atexit
import uuid
import datetime
import os

# Create a base class for declarative class definitions
Base = declarative_base()

# -----------------------------------------------------------------------------
# Tables
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    created_at = Column(String, default=lambda: str(datetime.datetime.now()))
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at
        }

class Projects(Base):
    __tablename__ = 'projects'
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    uuid = Column(String, nullable=False)
    description = Column(String)
    resources = Column(Integer, nullable=False)
    date_updated = Column(String, nullable=False)
    type = Column(String, default='object-detection')
    # Add user relationship
    user_id = Column(Integer, ForeignKey('users.id'))
    user = relationship("User", backref="projects")
    # Add relationship to images
    images = relationship("ProjectImage", back_populates="project", cascade="all, delete-orphan")

class ProjectImage(Base):
    __tablename__ = 'project_images'
    id = Column(Integer, primary_key=True)
    uuid = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    upload_date = Column(String, nullable=False)
    # Add project relationship
    project_id = Column(Integer, ForeignKey('projects.id'))
    project = relationship("Projects", back_populates="images")
    # Add user relationship
    user_id = Column(Integer, ForeignKey('users.id'))
    user = relationship("User")

# -----------------------------------------------------------------------------
    
class DBSession:
    def __init__(self, db_path) -> None:
        self.engine = create_engine(f'sqlite:///{db_path}')
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        
        atexit.register(self.destuctor)
        
    def destuctor(self):
        self.session.close()
        
# -----------------------------------------------------------------------------
# User methods
    def register_user(self, username, email, password):
        # Check if user already exists
        existing_user = self.session.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            return None
            
        # Create new user
        user = User(username=username, email=email)
        user.set_password(password)
        
        self.session.add(user)
        self.session.commit()
        
        return user.to_dict()
    
    def authenticate_user(self, email, password):
        user = self.session.query(User).filter_by(email=email).first()
        
        if user and user.check_password(password):
            return user.to_dict()
        
        return None
    
    def get_user_by_id(self, user_id):
        user = self.session.query(User).filter_by(id=user_id).first()
        if user:
            return user.to_dict()
        return None
        
# -----------------------------------------------------------------------------
# Projects methods
    def add_project(self, data, user_id=None):
        keys = ["name", "description"]
        for k in keys:
            if k not in data.keys():
                print(f"-> Can't find key {k} in params")
                return

        project_type = data.get("type", "object-detection")
        
        project = Projects(
            uuid=str(uuid.uuid4()),  
            name=data["name"],
            description=data["description"],
            resources=0,
            date_updated=str(datetime.datetime.now()),
            type=project_type
        )
        
        if user_id:
            project.user_id = user_id
            
        self.session.add(project)
        self.session.commit()

    def get_projects(self, user_id=None):
        if user_id:
            projects = self.session.query(Projects).filter_by(user_id=user_id).all()
        else:
            projects = self.session.query(Projects).all()
            
        result = []
        for project in projects:
            result.append({
                "id": project.id,
                "uuid": project.uuid,
                "name": project.name,
                "description": project.description,
                "resources": project.resources,
                "date_updated": project.date_updated,
                "type": project.type if hasattr(project, 'type') else "object-detection",
                "user_id": project.user_id
            })
        return result
        
    def get_project_by_id(self, project_id, user_id=None):
        query = self.session.query(Projects).filter_by(id=project_id)
        
        if user_id:
            query = query.filter_by(user_id=user_id)
            
        project = query.first()
        
        if not project:
            return None
            
        return {
            "id": project.id,
            "uuid": project.uuid,
            "name": project.name,
            "description": project.description,
            "resources": project.resources,
            "date_updated": project.date_updated,
            "type": project.type if hasattr(project, 'type') else "object-detection",
            "user_id": project.user_id
        }
        
    def get_project_by_uuid(self, project_uuid, user_id=None):
        query = self.session.query(Projects).filter_by(uuid=project_uuid)
        
        if user_id:
            query = query.filter_by(user_id=user_id)
            
        project = query.first()
        
        if not project:
            return None
            
        return {
            "id": project.id,
            "uuid": project.uuid,
            "name": project.name,
            "description": project.description,
            "resources": project.resources,
            "date_updated": project.date_updated,
            "type": project.type if hasattr(project, 'type') else "object-detection",
            "user_id": project.user_id
        }
        
    def delete_project_by_uuid(self, project_uuid, user_id=None):
        query = self.session.query(Projects).filter_by(uuid=project_uuid)
        
        if user_id:
            query = query.filter_by(user_id=user_id)
            
        project = query.first()
        
        if not project:
            return False
            
        self.session.delete(project)
        self.session.commit()
        return True

    def add_project_image(self, project_uuid, original_filename, file_path, file_size, user_id=None):
        # Get project by UUID
        project = self.session.query(Projects).filter_by(uuid=project_uuid).first()
        
        if not project:
            return None
            
        # Create new image record
        image = ProjectImage(
            uuid=str(uuid.uuid4()),
            original_filename=original_filename,
            file_path=file_path,
            file_size=file_size,
            upload_date=str(datetime.datetime.now()),
            project_id=project.id
        )
        
        if user_id:
            image.user_id = user_id
            
        # Update project resources count and date_updated
        project.resources += 1
        project.date_updated = str(datetime.datetime.now())
        
        self.session.add(image)
        self.session.commit()
        
        return {
            "id": image.id,
            "uuid": image.uuid,
            "original_filename": image.original_filename,
            "file_path": image.file_path,
            "file_size": image.file_size,
            "upload_date": image.upload_date,
            "project_id": image.project_id,
            "user_id": image.user_id
        }
        
    def get_project_images(self, project_uuid, user_id=None):
        # Get project by UUID
        project_query = self.session.query(Projects).filter_by(uuid=project_uuid)
        
        if user_id:
            project_query = project_query.filter_by(user_id=user_id)
            
        project = project_query.first()
        
        if not project:
            return []
            
        # Get all images for the project
        images = self.session.query(ProjectImage).filter_by(project_id=project.id).all()
        
        result = []
        for image in images:
            result.append({
                "id": image.id,
                "uuid": image.uuid,
                "original_filename": image.original_filename,
                "file_path": image.file_path,
                "file_size": image.file_size,
                "upload_date": image.upload_date,
                "project_id": image.project_id,
                "user_id": image.user_id
            })
            
        return result
        
    def get_image_by_uuid(self, image_uuid, user_id=None):
        # Get image by UUID
        query = self.session.query(ProjectImage).filter_by(uuid=image_uuid)
        
        if user_id:
            # Join with Projects to check user_id
            query = query.join(Projects).filter(Projects.user_id == user_id)
            
        image = query.first()
        
        if not image:
            return None
            
        return {
            "id": image.id,
            "uuid": image.uuid,
            "original_filename": image.original_filename,
            "file_path": image.file_path,
            "file_size": image.file_size,
            "upload_date": image.upload_date,
            "project_id": image.project_id,
            "project_uuid": image.project.uuid,
            "user_id": image.user_id
        }
        
    def delete_image(self, image_uuid, user_id=None):
        # Get image by UUID
        query = self.session.query(ProjectImage).filter_by(uuid=image_uuid)
        
        if user_id:
            # Join with Projects to check user_id
            query = query.join(Projects).filter(Projects.user_id == user_id)
            
        image = query.first()
        
        if not image:
            return False
            
        # Get project to update resources count
        project = image.project
        
        # Delete the image
        self.session.delete(image)
        
        # Update project resources count and date_updated
        if project.resources > 0:
            project.resources -= 1
        project.date_updated = str(datetime.datetime.now())
        
        self.session.commit()
        return True
        
    def update_project_resources_count(self, project_uuid):
        # Get project by UUID
        project = self.session.query(Projects).filter_by(uuid=project_uuid).first()
        
        if not project:
            return False
            
        # Count images for the project
        count = self.session.query(ProjectImage).filter_by(project_id=project.id).count()
        
        # Update project resources count
        project.resources = count
        project.date_updated = str(datetime.datetime.now())
        
        self.session.commit()
        return True
# -----------------------------------------------------------------------------
