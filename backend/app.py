from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import mimetypes

# Very important "fix" for sending js as text/javascript, not like text/plain
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('text/javascript', '.js')

app = Flask(__name__, static_folder='static/assets', static_url_path='/assets')
root = os.path.dirname(os.path.abspath(__file__))
fronend_path = f"{root}/annotate-app/dist"

@app.route('/', methods=['GET'])
def index():
    return render_template(f'index.html')

@app.route('/api/ver', methods=['GET'])
def api():
    return jsonify({
        'message': 'v0.0.1', 
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)