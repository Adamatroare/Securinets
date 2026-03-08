import os
from datetime import datetime
from flask import Flask, request, jsonify, session, send_from_directory, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin, AdminIndexView, expose
from flask_admin.contrib.sqla import ModelView
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_session import Session
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///classmates_only.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_NAME'] = 'classmates_session'
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])
Session(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    posts = db.relationship('Post', backref='author', lazy=True)
    replies = db.relationship('Reply', backref='author', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'

class Channel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    slug = db.Column(db.String(50), unique=True, nullable=False)
    posts = db.relationship('Post', backref='channel', lazy=True)

    def __repr__(self):
        return f'<Channel {self.name}>'

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    channel_id = db.Column(db.Integer, db.ForeignKey('channel.id'), nullable=False)
    media_url = db.Column(db.String(255), nullable=True)
    media_type = db.Column(db.String(50), nullable=True) # image, video, file
    replies = db.relationship('Reply', backref='post', lazy=True, cascade="all, delete-orphan")

class Reply(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)

# Admin Configuration
class MyAdminIndexView(AdminIndexView):
    def is_accessible(self):
        return session.get('is_admin')

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('login'))

class MyModelView(ModelView):
    def is_accessible(self):
        return session.get('is_admin')

admin = Admin(app, index_view=MyAdminIndexView())
admin.add_view(MyModelView(User, db.session))
admin.add_view(MyModelView(Channel, db.session))
admin.add_view(MyModelView(Post, db.session))
admin.add_view(MyModelView(Reply, db.session))

# Helpers
def get_current_user():
    user_id = session.get('user_id')
    if user_id:
        return User.query.get(user_id)
    return None

# Routes
@app.route('/api/init_db')
def init_db():
    db.create_all()
    if not Channel.query.filter_by(slug='general').first():
        db.session.add(Channel(name='Home', slug='general'))
        db.session.commit()
    return jsonify({"message": "Database initialized"}), 200

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username exists"}), 400
    
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(username=data['username'], password=hashed_pw)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and bcrypt.check_password_hash(user.password, data['password']):
        session['user_id'] = user.id
        session['username'] = user.username
        session['is_admin'] = user.is_admin
        return jsonify({
            "id": user.id,
            "username": user.username,
            "is_admin": user.is_admin
        }), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/logout')
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200

@app.route('/api/channels', methods=['GET'])
def get_channels():
    channels = Channel.query.all()
    return jsonify([{"id": c.id, "name": c.name, "slug": c.slug} for c in channels])

@app.route('/api/channels/<slug>/posts', methods=['GET'])
def get_posts(slug):
    channel = Channel.query.filter_by(slug=slug).first()
    if not channel:
        return jsonify({"error": "Channel not found"}), 404
    
    posts = Post.query.filter_by(channel_id=channel.id).order_by(Post.timestamp.desc()).all()
    return jsonify([{
        "id": p.id,
        "content": p.content,
        "timestamp": p.timestamp,
        "poster": p.author.username,
        "media_url": p.media_url,
        "media_type": p.media_type,
        "replies": [{
            "id": r.id,
            "content": r.content,
            "poster": r.author.username,
            "timestamp": r.timestamp
        } for r in p.replies]
    } for p in posts])

@app.route('/api/posts', methods=['POST'])
def create_post():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    
    channel_id = request.form.get('channel_id')
    channel = Channel.query.get(channel_id)
    content = request.form.get('content')
    
    # Permission check: Normal users can only post in 'general'
    if not user.is_admin and channel.slug != 'general':
        return jsonify({"error": "Admins only for this channel"}), 403

    file = request.files.get('file')
    media_url = None
    media_type = None
    
    if file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        media_url = filename
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            media_type = 'image'
        elif filename.lower().endswith(('.mp4', '.mov', '.avi')):
            media_type = 'video'
        else:
            media_type = 'file'

    new_post = Post(content=content, user_id=user.id, channel_id=channel_id, media_url=media_url, media_type=media_type)
    db.session.add(new_post)
    db.session.commit()
    return jsonify({"message": "Post created"}), 201

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Create default admin if not exists
        if not User.query.filter_by(username='admin').first():
            hashed_pw = bcrypt.generate_password_hash('admin123').decode('utf-8')
            admin_user = User(username='admin', password=hashed_pw, is_admin=True)
            db.session.add(admin_user)
            db.session.commit()
        # Create default channels
        channels_data = [
            ('Home', 'general'),
            ('Crypto', 'crypto'),
            ('Web Exp', 'web_exp'),
            ('Forensics', 'forensics'),
            ('Reverse Engineering', 'reverse'),
            ('Binary Exploitation', 'pwn'),
            ('Mobile Hacking', 'mobile'),
            ('Linux', 'linux'),
            ('Networking', 'networking'),
            ('Web Development', 'web_dev'),
            ('Threat Intelligence', 'threat_intel')
        ]
        for name, slug in channels_data:
            if not Channel.query.filter_by(slug=slug).first():
                db.session.add(Channel(name=name, slug=slug))
        db.session.commit()
        
    app.run(debug=True, port=5000)
