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
from routes.ai import ai_bp
from routes.copilot import copilot_bp
from routes.digital_twin import digital_twin_bp
from routes.waste import waste_bp
from routes.command_center import command_center_bp
from routes.quality import quality_bp

frontend_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist'))
uploads_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), 'uploads'))
os.makedirs(uploads_folder, exist_ok=True)

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
    app.register_blueprint(ai_bp)
    app.register_blueprint(copilot_bp)
    app.register_blueprint(digital_twin_bp)
    app.register_blueprint(waste_bp)
    app.register_blueprint(command_center_bp)
    app.register_blueprint(quality_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'FarmDirect Unified Fullstack Service',
            'version': '1.0.0',
            'database': 'connected'
        }), 200

    @app.route('/uploads/<path:filename>')
    def serve_uploaded_file(filename):
        return send_from_directory(uploads_folder, filename)

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
        try:
            from sqlalchemy import text, inspect
            inspector = inspect(db.engine)
            if 'quality_inspections' in inspector.get_table_names():
                existing_cols = {c['name'] for c in inspector.get_columns('quality_inspections')}
                new_cols = [
                    ('expected_crop', 'VARCHAR(100)'),
                    ('detected_crop', 'VARCHAR(100)'),
                    ('crop_confidence', 'FLOAT DEFAULT 0.0'),
                    ('image_quality_status', 'VARCHAR(50) DEFAULT "VALID"'),
                    ('visible_defect_level', 'VARCHAR(50) DEFAULT "LOW"'),
                    ('defect_confidence', 'FLOAT DEFAULT 0.0'),
                    ('model_name', 'VARCHAR(100) DEFAULT "FarmDirect-AgriVision-ColorTextureEngine"'),
                    ('model_version', 'VARCHAR(50) DEFAULT "2.0.0"')
                ]
                with db.engine.connect() as conn:
                    for col_name, col_type in new_cols:
                        if col_name not in existing_cols:
                            conn.execute(text(f'ALTER TABLE quality_inspections ADD COLUMN {col_name} {col_type}'))
                    conn.commit()
        except Exception as e:
            app.logger.warning(f"Schema column verification warning: {e}")

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting FarmDirect Unified Server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
