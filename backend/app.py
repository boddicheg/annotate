from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import mimetypes
import datetime
import functools

from proejcts import *
from auth import AuthController

# Very important "fix" for sending js as text/javascript, not like text/plain
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('text/javascript', '.js')


template_dir = os.path.abspath('../annotate-app/dist')
app = Flask(__name__, template_folder=template_dir, static_folder=template_dir + '/assets')
CORS(app)  # Enable CORS for all routes

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

@app.route('/api/projects', methods=['POST'])
@token_required
def api_projects_add():
    data = request.get_json()
    user_id = request.current_user['id']
    
    g_projects.add_project(data, user_id)
    
    return jsonify({
        "message": "Added successfully"
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=1337)