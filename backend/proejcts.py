from database.models import *

DB_PATH = "db.sqlite"

class ProjectsController():
    def __init__(self, root) -> None:
        self.database = DBSession(DB_PATH)
        
    def get_projects(self, user_id=None):
        return self.database.get_projects(user_id)
    
    def add_project(self, data, user_id=None):
        return self.database.add_project(data, user_id)