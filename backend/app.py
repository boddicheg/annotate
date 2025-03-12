from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import mimetypes
import datetime
import functools
from werkzeug.utils import secure_filename

from proejcts import *
from auth import AuthController

# Very important "fix" for sending js as text/javascript, not like text/plain
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('text/javascript', '.js')

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

template_dir = os.path.abspath('../annotate-app/dist')
app = Flask(__name__, template_folder=template_dir, static_folder=template_dir + '/assets')
CORS(app)  # Enable CORS for all routes

# Set maximum file upload size to 16MB
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# app = Flask(__name__, static_folder='static/assets', static_url_path='/assets')
root = os.path.dirname(os.path.abspath(__file__))
# fronend_path = f"{root}/annotate-app/dist"

g_projects = ProjectsController(root)
g_auth = AuthController()

# Authentication middleware
def token_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        print(f"Auth header: {auth_header}")
        
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            print(f"Extracted token: {token[:20]}...")
            
        if not token:
            return jsonify({"error": "Authentication token is missing"}), 401
            
        result, status_code = g_auth.get_current_user(token)
        
        if status_code != 200:
            return jsonify(result), status_code
            
        # Add user to request context
        request.current_user = result['user']
        return f(*args, **kwargs)
        
    return decorated

@app.route('/', methods=['GET'])
def index():
    return render_template(f'index.html')

@app.route('/api/ver', methods=['GET'])
def api():
    return jsonify({
        'message': 'v0.0.1', 
    }), 200

# Authentication routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    result, status_code = g_auth.register(data)
    return jsonify(result), status_code

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    result, status_code = g_auth.login(data)
    return jsonify(result), status_code

@app.route('/api/auth/user', methods=['GET'])
@token_required
def get_user():
    return jsonify({"user": request.current_user}), 200

# Project routes
@app.route('/api/projects', methods=['GET'])
@token_required
def api_projects_get():
    user_id = request.current_user['id']
    return jsonify(g_projects.get_projects(user_id)), 200

@app.route('/api/projects/<int:project_id>', methods=['GET'])
@token_required
def api_project_get(project_id):
    user_id = request.current_user['id']
    project = g_projects.get_project_by_id(project_id, user_id)
    
    if not project:
        return jsonify({"error": "Project not found"}), 404
        
    return jsonify(project), 200

@app.route('/api/projects/uuid/<string:project_uuid>', methods=['GET'])
@token_required
def api_project_get_by_uuid(project_uuid):
    user_id = request.current_user['id']
    project = g_projects.get_project_by_uuid(project_uuid, user_id)
    
    if not project:
        return jsonify({"error": "Project not found"}), 404
        
    return jsonify(project), 200

@app.route('/api/projects/uuid/<string:project_uuid>', methods=['DELETE'])
@token_required
def api_project_delete_by_uuid(project_uuid):
    user_id = request.current_user['id']
    
    # Check if project exists first
    project = g_projects.get_project_by_uuid(project_uuid, user_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    
    # Delete the project
    success = g_projects.delete_project_by_uuid(project_uuid, user_id)
    
    if success:
        return jsonify({
            "message": "Project deleted successfully",
            "success": True
        }), 200
    else:
        return jsonify({
            "error": "Failed to delete project",
            "success": False
        }), 500

@app.route('/api/projects', methods=['POST'])
@token_required
def api_projects_add():
    data = request.get_json()
    user_id = request.current_user['id']
    
    g_projects.add_project(data, user_id)
    
    return jsonify({
        "message": "Added successfully"
    }), 200

@app.route('/api/projects/upload', methods=['POST'])
@token_required
def api_projects_upload():
    user_id = request.current_user['id']
    
    # Check if project UUID is provided
    project_uuid = request.form.get('projectUuid')
    if not project_uuid:
        return jsonify({"error": "Project UUID is required"}), 400
    
    # Check if project exists
    project = g_projects.get_project_by_uuid(project_uuid, user_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    
    # Check if files are provided
    if 'files' not in request.files:
        return jsonify({"error": "No files provided"}), 400
    
    files = request.files.getlist('files')
    if not files or files[0].filename == '':
        return jsonify({"error": "No files selected"}), 400
    
    uploaded_files = []
    for file in files:
        if file and allowed_file(file.filename):
            # Upload the file
            image, error = g_projects.upload_image(project_uuid, file, user_id)
            if image:
                uploaded_files.append(image)
            else:
                return jsonify({"error": error}), 400
        else:
            return jsonify({"error": f"File type not allowed: {file.filename}"}), 400
    
    return jsonify({
        "message": f"Successfully uploaded {len(uploaded_files)} files",
        "files": uploaded_files
    }), 200

@app.route('/api/projects/uuid/<string:project_uuid>/images', methods=['GET'])
@token_required
def api_project_images_get(project_uuid):
    user_id = request.current_user['id']
    
    # Check if project exists
    project = g_projects.get_project_by_uuid(project_uuid, user_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    
    # Get project images
    images = g_projects.get_project_images(project_uuid, user_id)
    
    return jsonify(images), 200

@app.route('/api/projects/images/<string:image_uuid>', methods=['DELETE'])
@token_required
def api_image_delete(image_uuid):
    user_id = request.current_user['id']
    
    # Delete the image
    success, message = g_projects.delete_image(image_uuid, user_id)
    
    if success:
        return jsonify({
            "message": "Image deleted successfully",
            "success": True
        }), 200
    else:
        return jsonify({
            "error": message,
            "success": False
        }), 404

# Serve uploaded files
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    # Public access to uploaded files (no authentication required)
    return send_from_directory(os.path.join(root, 'uploads'), filename)

# Secure endpoint to get image data with authentication
@app.route('/api/images/<path:filename>')
def get_image_data(filename):
    # Check for token in query parameter
    token = request.args.get('token')
    
    if not token:
        # Fall back to Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
    
    if not token:
        return jsonify({"error": "Authentication token is missing"}), 401
    
    # Validate token
    result, status_code = g_auth.get_current_user(token)
    if status_code != 200:
        return jsonify(result), status_code
    
    # Check if file exists
    file_path = os.path.join(root, 'uploads', filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    # Return the file with appropriate content type
    return send_from_directory(os.path.join(root, 'uploads'), filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=1337)