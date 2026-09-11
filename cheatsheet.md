# Full-Stack App Cheatsheet

This cheatsheet covers the core libraries, syntax, and methods used in this architecture. You can refer to this as you build out the application.

---

## 1. Flask Basics

### Routing & Methods
```python
@app.route('/api/users', methods=['GET', 'POST'])
def manage_users():
    if request.method == 'POST':
        pass
```

### Request Data
```python
from flask import request

# 1. Get JSON payload from a POST/PUT request
data = request.get_json()

# 2. Get query parameters (GET data, e.g., ?page=2)
page = request.args.get('page', 1, type=int)

# 3. Get form data (POST data sent as multipart/form-data or urlencoded)
username = request.form.get('username')

# 4. Get a file uploaded via POST request
uploaded_file = request.files.get('document')
if uploaded_file:
    # Get filename
    filename = uploaded_file.filename
    # Read the file's content as a byte object
    file_bytes = uploaded_file.read()
```

### Returning Responses
```python
from flask import jsonify

# Return JSON with a specific HTTP status code
return jsonify({"message": "Success", "data": {...}}), 200
return jsonify({"error": "Not Found"}), 404
```

### Blueprints (Modular Routing)
```python
from flask import Blueprint

# Define a blueprint
users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
def get_users():
    return jsonify([])

# In app/__init__.py, register it:
app.register_blueprint(users_bp, url_prefix='/api/users')
```

---

## 2. Architecture: `extensions.py`

### What is `extensions.py` for?
In Flask, extensions like `SQLAlchemy`, `Migrate`, and `JWTManager` need to be connected to the Flask `app` instance. However, if we instantiate them inside `app/__init__.py`, other files (like models or API blueprints) would need to import them from `app/__init__.py`. This often causes **circular imports** (e.g., `app` imports `models`, but `models` imports `db` from `app`).

To prevent this, we instantiate extensions in `extensions.py` *without* an app instance:
```python
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
```
Then, we import them safely elsewhere. Finally, in `app/__init__.py`, we initialize them with the actual app instance using `init_app()`:
```python
from app.extensions import db, migrate, jwt

db.init_app(app)
migrate.init_app(app, db)
jwt.init_app(app)
```

---

## 3. Flask-SQLAlchemy (Database)

### Defining a Model
```python
from app.extensions import db

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, default=0.0)
    is_active = db.Column(db.Boolean, default=True)
    
    # Foreign Key relationship
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
```

### CRUD Operations
```python
# Create
new_item = Product(name='Laptop', price=999.99)
db.session.add(new_item)
db.session.commit()

# Read (Querying)
all_products = Product.query.all()
first_product = Product.query.first()
product_by_id = Product.query.get(1) # get by Primary Key

# Filter
active_products = Product.query.filter_by(is_active=True).all()
expensive = Product.query.filter(Product.price > 500).all()

# Update
product = Product.query.get(1)
product.price = 899.99
db.session.commit()

# Delete
db.session.delete(product)
db.session.commit()
```

---

## 4. Flask-Migrate (Database Migrations)

Run these commands in the terminal (inside the `backend` folder):

```bash
# 1. Initialize migrations (Run this only ONCE per project)
flask db init

# 2. Generate a new migration file after changing models
flask db migrate -m "Added Product model"

# 3. Apply the changes to the database
flask db upgrade
```

---

## 5. Flask-JWT-Extended (Authentication)

### Generating Tokens
```python
from flask_jwt_extended import create_access_token, set_access_cookies

# Generate a token with the user's ID
access_token = create_access_token(identity=str(user.id))

# Return it in an HttpOnly Cookie (secure approach)
response = jsonify({"message": "Logged in"})
set_access_cookies(response, access_token)
return response
```

### Protecting Routes
```python
from flask_jwt_extended import jwt_required, get_jwt_identity

@app.route('/api/protected', methods=['GET'])
@jwt_required() # Requires a valid JWT (in cookie or header)
def protected_route():
    # Get the identity (user ID) from the token
    current_user_id = get_jwt_identity()
    return jsonify(logged_in_as=current_user_id)
```

### Logging Out
```python
from flask_jwt_extended import unset_jwt_cookies

@app.route('/api/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "Logout successful"})
    unset_jwt_cookies(response) # Clears the auth cookies
    return response
```

---

## 6. Bcrypt (Password Hashing)

```python
from app.models.Encrypter import encrypter

# 1. Hashing a password (during Registration)
hashed_pw = encrypter.create_hash("my_secret_password")
# Save `hashed_pw` to the database (it returns a string)

# 2. Checking a password (during Login)
# Assume 'user.password_hash' is retrieved from DB
if encrypter.verify_hash("my_secret_password", user.password_hash):
    print("Password matches!")
else:
    print("Invalid password.")
```

---

## 7. React + Vite Frontend 

### API Calls
Since the proxy is set up in `vite.config.ts`, you should always use relative paths starting with `/api` to avoid CORS issues.

```javascript
import { useEffect, useState } from 'react';

function ExampleComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Note the relative URL!
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error(err));
  }, []);

  // ...
}
```

### Submitting Data
```javascript
const handleLogin = async () => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: "test@example.com", password: "password123" })
    });
    
    const result = await response.json();
    if (response.ok) {
        console.log("Logged in!", result);
    }
}
```
