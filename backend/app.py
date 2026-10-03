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
from routes.agent import agent_bp

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
    app.register_blueprint(agent_bp)

    @app.route('/health', methods=['GET'])
    @app.route('/api/health', methods=['GET'])
    def health_check():
        db_status = 'connected'
        try:
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
        except Exception as e:
            db_status = f'disconnected: {str(e)}'

        is_connected = (db_status == 'connected')
        return jsonify({
            'status': 'ok' if is_connected else 'degraded',
            'database': db_status,
            'service': 'FarmDirect Unified Fullstack Service',
            'version': '1.0.0'
        }), 200 if is_connected else 500

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
        try:
            db.create_all()
            app.logger.info("Database tables verified/created successfully.")
        except Exception as e:
            app.logger.error(f"Database initialization warning on startup: {e}")
        try:
            from sqlalchemy import text, inspect
            inspector = inspect(db.engine)
            table_names = inspector.get_table_names()
            is_pg = 'postgresql' in str(db.engine.url)

            # Auto-migrate 'orders' table for post-delivery ratings
            if 'orders' in table_names:
                existing_cols = {c['name'] for c in inspector.get_columns('orders')}
                order_cols = [
                    ('rating', 'INTEGER'),
                    ('review_text', 'TEXT'),
                    ('rated_at', 'TIMESTAMP' if is_pg else 'DATETIME')
                ]
                with db.engine.connect() as conn:
                    for col_name, col_type in order_cols:
                        if col_name not in existing_cols:
                            try:
                                conn.execute(text(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}"))
                            except Exception as ex:
                                app.logger.warning(f"Could not add {col_name} to orders: {ex}")
                    conn.commit()

            # Auto-migrate 'produce_listings' table
            if 'produce_listings' in table_names:
                existing_cols = {c['name'] for c in inspector.get_columns('produce_listings')}
                produce_cols = [
                    ('available_quantity', 'FLOAT'),
                    ('rejection_reason', 'TEXT'),
                    ('reviewed_at', 'TIMESTAMP' if is_pg else 'DATETIME'),
                    ('reviewed_by_id', 'INTEGER'),
                    ('verification_key', 'VARCHAR(30)'),
                    ('agent_review', 'TEXT')
                ]
                with db.engine.connect() as conn:
                    for col_name, col_type in produce_cols:
                        if col_name not in existing_cols:
                            try:
                                conn.execute(text(f"ALTER TABLE produce_listings ADD COLUMN {col_name} {col_type}"))
                            except Exception as ex:
                                app.logger.warning(f"Could not add {col_name} to produce_listings: {ex}")
                    # Auto-populate verification keys for any listings missing them
                    try:
                        import secrets
                        from models import ProduceListing
                        listings_without_keys = ProduceListing.query.filter(ProduceListing.verification_key.is_(None)).all()
                        for pl in listings_without_keys:
                            pl.verification_key = f"VRF-{secrets.token_hex(3).upper()}"
                        if listings_without_keys:
                            db.session.commit()
                            app.logger.info(f"Auto-generated verification keys for {len(listings_without_keys)} existing produce listings.")
                    except Exception as ex:
                        app.logger.warning(f"Verification key auto-population notice: {ex}")
                    conn.commit()

            # Auto-migrate 'quality_inspections' table
            if 'quality_inspections' in table_names:
                existing_cols = {c['name'] for c in inspector.get_columns('quality_inspections')}
                new_cols = [
                    ('expected_crop', 'VARCHAR(100)'),
                    ('detected_crop', 'VARCHAR(100)'),
                    ('crop_confidence', 'FLOAT DEFAULT 0.0'),
                    ('image_quality_status', "VARCHAR(50) DEFAULT 'VALID'"),
                    ('visible_defect_level', "VARCHAR(50) DEFAULT 'LOW'"),
                    ('defect_confidence', 'FLOAT DEFAULT 0.0'),
                    ('model_name', "VARCHAR(100) DEFAULT 'FarmDirect-AgriVision-ColorTextureEngine'"),
                    ('model_version', "VARCHAR(50) DEFAULT '2.0.0'"),
                    ('image_hash', 'VARCHAR(64)')
                ]
                with db.engine.connect() as conn:
                    for col_name, col_type in new_cols:
                        if col_name not in existing_cols:
                            try:
                                conn.execute(text(f"ALTER TABLE quality_inspections ADD COLUMN {col_name} {col_type}"))
                            except Exception as ex:
                                app.logger.warning(f"Could not add {col_name} to quality_inspections: {ex}")
                    conn.commit()

            # Verify 'order_complaints' table
            if 'order_complaints' not in table_names:
                try:
                    from models import OrderComplaint
                    OrderComplaint.__table__.create(db.engine)
                    app.logger.info("Explicitly created missing table 'order_complaints'.")
                except Exception as ex:
                    app.logger.warning(f"OrderComplaint table creation notice: {ex}")

            # Verify 'agent_profiles' table
            if 'agent_profiles' not in table_names:
                try:
                    from models import AgentProfile
                    AgentProfile.__table__.create(db.engine)
                    app.logger.info("Explicitly created missing table 'agent_profiles'.")
                except Exception as ex:
                    app.logger.warning(f"AgentProfile table creation notice: {ex}")
        except Exception as e:
            app.logger.warning(f"Schema column verification warning: {e}")

        # Idempotently seed baseline users and listings if enabled
        if app.config.get('ENABLE_DEMO_SEED', True):
            try:
                from models import User
                if User.query.filter_by(email="admin@farmdirect.demo").first() is None:
                    app.logger.info("Baseline admin user missing. Running idempotent database seeding...")
                    from seed import seed_database
                    seed_database()
            except Exception as e:
                app.logger.warning(f"Auto-seed verification warning: {e}")

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting FarmDirect Unified Server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
