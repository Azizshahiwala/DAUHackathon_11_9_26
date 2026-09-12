from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.Database import User, db
from app.models.Encrypter import encrypter

def error_response(code, message, details=None, status=400):
    return jsonify({"error": {"code": code, "message": message, "details": details or {}}}), status


authentication = Blueprint("auth", __name__)


@authentication.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "operator")
    if not email or not password:
        return error_response("missing_fields", "email and password are required.",
                              {"fields": [f for f in ["email", "password"] if not data.get(f)]})
    if User.query.filter_by(email=email).first():
        return error_response("duplicate_email", "A user with this email already exists.", status=409)
    hashed = encrypter.create_hash(password)
    user = User(email=email, password_hash=hashed, role=role)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully.", "user": user.to_dict()}), 201


@authentication.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return error_response("missing_fields", "email and password are required.",
                              {"fields": [f for f in ["email", "password"] if not data.get(f)]})
    user = User.query.filter_by(email=email).first()
    if not user or not encrypter.verify_hash(password, user.password_hash):
        return error_response("invalid_credentials", "Invalid email or password.", status=401)
    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


@authentication.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out successfully."}), 200

@authentication.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Return the currently authenticated user's profile and role."""
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": {"code": "not_found", "message": "User not found.", "details": {}}}), 404
    return jsonify({"success": True, "data": user.to_dict()}), 200

