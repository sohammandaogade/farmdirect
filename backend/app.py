import os
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from config import Config
from database import db

# Import Blueprints
from routes.auth import auth_bp
from routes.farmers import farmers_bp
from routes.buyers import buyers_bp
from routes.marketplace import marketplace_bp
from routes.matching import matching_bp
from routes.requests import requests_bp
from routes.negotiations import negotiations_bp
from routes.orders import orders_bp
from routes.price import price_bp
from routes.logistics import logistics_bp
from routes.analytics import analytics_bp
from routes.admin import admin_bp
from routes.notifications import notifications_bp

frontend_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))

def create_app(config_class=Config):
    app = Flask(__name__, static_folder=frontend_folder, static_url_path='')
    app.config.from_object(config_class)

    # Enable CORS for cross-origin callers
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize Database
    db.init_app(app)

    # Register API Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(farmers_bp)
    app.register_blueprint(buyers_bp)
    app.register_blueprint(marketplace_bp)
    app.register_blueprint(matching_bp)
    app.register_blueprint(requests_bp)
    app.register_blueprint(negotiations_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(price_bp)
    app.register_blueprint(logistics_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(notifications_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'FarmDirect Unified Fullstack Service',
            'version': '1.0.0',
            'database': 'connected'
        }), 200

    # Serve built React Single Page Application
    @app.route('/')
    def serve_index():
        if os.path.exists(os.path.join(app.static_folder, 'index.html')):
            return send_from_directory(app.static_folder, 'index.html')
        return jsonify({
            'status': 'healthy',
            'service': 'FarmDirect Backend API',
            'message': 'API is active. Frontend build not detected.'
        }), 200

    @app.route('/<path:path>')
    def serve_static_or_spa(path):
        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        elif not path.startswith('api/') and os.path.exists(os.path.join(app.static_folder, 'index.html')):
            return send_from_directory(app.static_folder, 'index.html')
        return jsonify({'success': False, 'message': 'Resource not found'}), 404

    @app.errorhandler(404)
    def handle_404(e):
        if request.path.startswith('/api/'):
            return jsonify({'success': False, 'message': 'API endpoint not found'}), 404
        if os.path.exists(os.path.join(app.static_folder, 'index.html')):
            return send_from_directory(app.static_folder, 'index.html')
        return jsonify({'success': False, 'message': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting FarmDirect Unified Server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
