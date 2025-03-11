from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import mimetypes
import datetime

from proejcts import *

# Very important "fix" for sending js as text/javascript, not like text/plain
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('text/javascript', '.js')


template_dir = os.path.abspath('../annotate-app/dist')
app = Flask(__name__, template_folder=template_dir, static_folder=template_dir + '/assets')
# app = Flask(__name__, static_folder='static/assets', static_url_path='/assets')
root = os.path.dirname(os.path.abspath(__file__))
# fronend_path = f"{root}/annotate-app/dist"

g_projects = ProjectsController(root)

@app.route('/', methods=['GET'])
def index():
    return render_template(f'index.html')

@app.route('/api/ver', methods=['GET'])
def api():
    return jsonify({
        'message': 'v0.0.1', 
    }), 200

@app.route('/api/projects', methods=['GET'])
def api_projects_get():
    return jsonify(g_projects.get_projects()), 200

@app.route('/api/projects', methods=['POST'])
def api_projects_add():
    data = request.get_json()
    
    g_projects.add_project(data)
    
    return jsonify({
        "message": "Added successfully"
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=1337)