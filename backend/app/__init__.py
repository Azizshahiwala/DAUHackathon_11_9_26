import os
from flask import Flask, send_from_directory, jsonify
from app.config import config_by_name
from app.extensions import db, migrate, jwt

def create_app(config_name="development"):
    app = Flask(__name__, static_folder='dist/assets')
    app.config.from_object(config_by_name[config_name])
    
    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Configure JWT to use cookies by default, with CSRF protection enabled in prod
    app.config['JWT_TOKEN_LOCATION'] = ['cookies', 'headers']
    if config_name == "production":
        app.config['JWT_COOKIE_CSRF_PROTECT'] = True
    else:
        app.config['JWT_COOKIE_CSRF_PROTECT'] = False
    
    # Register blueprints
    from app.api.health import health_bp
    from app.api.auth import authentication
    
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(authentication, url_prefix='/api/auth')
    
    # Add ProxyFix for Render
    if config_name == "production":
        from werkzeug.middleware.proxy_fix import ProxyFix
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    # Static + SPA fallback
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        # Prevent API routes from falling back to frontend
        if path.startswith('api/'):
            return jsonify({"error": "Not Found"}), 404
            
        dist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')
        
        # Serve static files if they exist
        if path != "" and os.path.exists(os.path.join(dist_dir, path)):
            return send_from_directory(dist_dir, path)
            
        # Fallback to index.html for React Router
        if os.path.exists(os.path.join(dist_dir, 'index.html')):
            return send_from_directory(dist_dir, 'index.html')
            
        return jsonify({"error": "Frontend build not found"}), 404
        
    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404
        
    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app
