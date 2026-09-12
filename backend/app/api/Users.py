from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.Database import User, db

# Structured error helper
def error_response(code, message, details=None, status=400):
    payload = {"error": {"code": code, "message": message, "details": details or {}}}
    return jsonify(payload), status

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/', methods=['GET'])
@jwt_required()
def list_users():
    users = User.query.all()
    result = [u.to_dict() for u in users]
    return jsonify(result), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response('not_found', f'User {user_id} not found', status=404)
    return jsonify(user.to_dict()), 200

@users_bp.route('/', methods=['POST'])
@jwt_required()
def create_user():
    data = request.get_json() or {}
    email = data.get('email')
    password_hash = data.get('password_hash')
    role = data.get('role', 'operator')
    missing = []
    if not email:
        missing.append('email')
    if not password_hash:
        missing.append('password_hash')
    if missing:
        return error_response('missing_fields', 'Required fields are missing', {'fields': missing})
    user = User(email=email, password_hash=password_hash, role=role)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response('not_found', f'User {user_id} not found', status=404)
    data = request.get_json() or {}
    if 'email' in data:
        user.email = data['email']
    if 'password_hash' in data:
        user.password_hash = data['password_hash']
    if 'role' in data:
        user.role = data['role']
    db.session.commit()
    return jsonify(user.to_dict()), 200

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response('not_found', f'User {user_id} not found', status=404)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f'User {user_id} deleted'}), 200
