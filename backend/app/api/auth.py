from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.Encrypter import encrypter

authentication = Blueprint('auth', __name__)

@authentication.route('/register', methods=['POST'])
def register():
    data = request.get_json()
   
    return jsonify({"message": "User created successfully"}), 201

@authentication.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    response = jsonify({"message": "Login successful"})
  
    return response, 200

@authentication.route('/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "Logout successful"})
    return response, 200

