from database.models import *
import os
import uuid

DB_PATH = "db.sqlite"
UPLOAD_FOLDER = "uploads"

class ProjectsController():
    def __init__(self, root) -> None:
        self.database = DBSession(DB_PATH)
        self.root = root
        
        # Ensure upload folder exists
        self.upload_folder = os.path.join(root, UPLOAD_FOLDER)
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder)
        
    def get_projects(self, user_id=None):
        return self.database.get_projects(user_id)
    
    def get_project_by_id(self, project_id, user_id=None):
        return self.database.get_project_by_id(project_id, user_id)
    
    def get_project_by_uuid(self, project_uuid, user_id=None):
        return self.database.get_project_by_uuid(project_uuid, user_id)
    
    def delete_project_by_uuid(self, project_uuid, user_id=None):
        # Get project images first to delete files
        project = self.database.get_project_by_uuid(project_uuid, user_id)
        if project:
            # Delete project folder if it exists
            project_folder = os.path.join(self.upload_folder, project_uuid)
            if os.path.exists(project_folder):
                for file in os.listdir(project_folder):
                    file_path = os.path.join(project_folder, file)
                    try:
                        if os.path.isfile(file_path):
                            os.unlink(file_path)
                    except Exception as e:
                        print(f"Error deleting file {file_path}: {e}")
                try:
                    os.rmdir(project_folder)
                except Exception as e:
                    print(f"Error deleting folder {project_folder}: {e}")
        
        return self.database.delete_project_by_uuid(project_uuid, user_id)
    
    def add_project(self, data, user_id=None):
        return self.database.add_project(data, user_id)
    
    def upload_image(self, project_uuid, file, user_id=None):
        # Check if project exists
        project = self.database.get_project_by_uuid(project_uuid, user_id)
        if not project:
            return None, "Project not found"
        
        # Create project folder if it doesn't exist
        project_folder = os.path.join(self.upload_folder, project_uuid)
        if not os.path.exists(project_folder):
            os.makedirs(project_folder)
        
        # Generate a unique filename
        original_filename = file.filename
        file_extension = os.path.splitext(original_filename)[1]
        new_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(project_folder, new_filename)
        
        # Save the file
        file.save(file_path)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Add image to database
        relative_path = os.path.join(UPLOAD_FOLDER, project_uuid, new_filename)
        image = self.database.add_project_image(
            project_uuid=project_uuid,
            original_filename=original_filename,
            file_path=relative_path,
            file_size=file_size,
            user_id=user_id
        )
        
        return image, None
    
    def get_project_images(self, project_uuid, user_id=None):
        return self.database.get_project_images(project_uuid, user_id)
        
    def delete_image(self, image_uuid, user_id=None):
        # Get the image first to check ownership and get file path
        image = self.database.get_image_by_uuid(image_uuid, user_id)
        
        if not image:
            return False, "Image not found or you don't have permission to delete it"
        
        # Delete the file from disk
        file_path = os.path.join(self.root, image['file_path'])
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            return False, f"Error deleting file: {str(e)}"
        
        # Delete the image from database
        success = self.database.delete_image(image_uuid, user_id)
        
        if success:
            # Update project resources count
            self.database.update_project_resources_count(image['project_uuid'])
            return True, "Image deleted successfully"
        else:
            return False, "Failed to delete image from database"