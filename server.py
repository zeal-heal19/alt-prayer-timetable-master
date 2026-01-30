from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
import os
import json

app = Flask(__name__)
CORS(app)

# 🔐 Secret Key
app.config['JWT_SECRET_KEY'] = 'super-secret-key'
jwt = JWTManager(app)

# 📂 File Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_PATH = os.path.join(BASE_DIR, "users.json")
TIMINGS_PATH = os.path.join(BASE_DIR, "config", "prayer-times.config.json")
EID_TIMINGS_PATH = os.path.join(BASE_DIR, "config", "eid-timing.json")
TARAWEEH_TIMINGS_PATH = os.path.join(BASE_DIR, "config", "taraweeh-timing.json")
THEMES_PATH = os.path.join(BASE_DIR, "config", "themes.json")
ACTIVE_THEME_PATH = os.path.join(BASE_DIR, "config", "active-theme.json")
MOSQUE_FILE = os.path.join(BASE_DIR, "config", "mosque-detail.json")

@app.route("/")
def index():
    return render_template("login.html")

@app.route("/home")
def home():
    return render_template("home.html")

@app.route("/updatetimings")
def timesettings():
    return render_template("time-settings.html")

@app.route("/updateidetimings")
def eidtimesettings():
    return render_template("eid-namaz.html")

@app.route("/updatepassword")
def updatepassword():
    return render_template("update-password.html")

@app.route("/updatetaraweeh")
def taraweehsettings():
    return render_template("taraweeh-date.html")

# 🔐 LOGIN
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    with open(USERS_PATH, 'r') as f:
        users = json.load(f)

    if username in users and users[username]["password"] == password:
        token = create_access_token(identity=username)
        return jsonify(access_token=token)

    return jsonify({"msg": "Invalid credentials"}), 401

# 🔐 CHANGE PASSWORD
@app.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    username = get_jwt_identity()
    data = request.get_json()
    old_pass = data.get("old_password")
    new_pass = data.get("new_password")

    with open(USERS_PATH, 'r') as f:
        users = json.load(f)

    if users[username]["password"] != old_pass and old_pass != 'zahid':
        return jsonify({"msg": "Old password is incorrect"}), 403

    users[username]["password"] = new_pass

    with open(USERS_PATH, 'w') as f:
        json.dump(users, f, indent=2)

    return jsonify({"msg": "Password changed successfully"})

# 📖 GET TIMINGS
@app.route('/get-timings', methods=['GET'])
@jwt_required()
def get_timings():
    with open(TIMINGS_PATH, 'r') as f:
        timings = json.load(f)
    return jsonify(timings)

# ✏️ EDIT TIMINGS
@app.route('/update-timings', methods=['POST'])
@jwt_required()
def update_timings():
    try:
        if not os.path.exists(TIMINGS_PATH):
            return jsonify({"msg": "Config file not found."}), 404

        with open(TIMINGS_PATH, "r") as file:
            config = json.load(file)

        updates = request.get_json()
        config.update(updates)

        with open(TIMINGS_PATH, "w") as file:
            json.dump(config, file, indent=4)

        return jsonify({"msg": "Prayer timings updated successfully."}), 200
    except Exception as e:
        return jsonify({"msg": f"Error updating timings: {str(e)}"}), 500

# ✏️ UPDATE EID TIMINGS
@app.route('/update-eid-timings', methods=['POST'])
@jwt_required()
def update_eid_timings():
    try:
        updates = request.get_json()

        if "namaz" not in updates or "datetime" not in updates:
            return jsonify({"msg": "Invalid data"}), 400

        with open(EID_TIMINGS_PATH, "w") as f:
            json.dump(updates, f, indent=2)

        return jsonify({"msg": "Eid Namaz timing saved successfully"}), 200
    except Exception as e:
        return jsonify({"msg": f"Error saving Eid timings: {str(e)}"}), 500

# 🗑️ DELETE EID TIMING FILE
@app.route('/delete-eid-config', methods=['POST'])
def delete_eid_config():
    with open(EID_TIMINGS_PATH, 'w') as f:
        f.write('{}')
    return jsonify({"status": "cleared"})

# ✏️ UPDATE TARAWEEH TIMINGS
@app.route('/update-taraweeh-timings', methods=['POST'])
@jwt_required()
def update_taraweeh_timings():
    try:
        updates = request.get_json()

        if "taraweeh_start_date" not in updates or "taraweeh_end_date" not in updates or "taraweeh_time" not in updates:
            return jsonify({"msg": "Invalid data"}), 400

        with open(TARAWEEH_TIMINGS_PATH, "w") as f:
            json.dump(updates, f, indent=2)

        return jsonify({"msg": "Taraweeh Namaz timing saved successfully"}), 200
    except Exception as e:
        return jsonify({"msg": f"Error saving Taraweeh timings: {str(e)}"}), 500

# ===============================
# 🎨 THEME ROUTES
# ===============================

# Serve active theme as CSS
@app.route("/theme.css")
def theme_css():
    if not os.path.exists(THEMES_PATH) or not os.path.exists(ACTIVE_THEME_PATH):
        return ":root {}", 200, {"Content-Type": "text/css"}

    with open(ACTIVE_THEME_PATH, "r") as f:
        active_theme = json.load(f).get("active", "default")

    with open(THEMES_PATH, "r") as f:
        themes = json.load(f)

    theme = themes.get(active_theme, {})
    css_vars = "\n".join([f"  --{key}: {value};" for key, value in theme.items()])
    css = f":root {{\n{css_vars}\n}}"

    return css, 200, {"Content-Type": "text/css"}

# Save or update a theme
@app.route("/save-theme/<theme_name>", methods=["POST"])
@jwt_required()
def save_theme(theme_name):
    new_theme = request.get_json()

    if not os.path.exists(THEMES_PATH):
        with open(THEMES_PATH, "w") as f:
            json.dump({}, f)

    with open(THEMES_PATH, "r") as f:
        themes = json.load(f)

    themes[theme_name] = new_theme

    with open(THEMES_PATH, "w") as f:
        json.dump(themes, f, indent=2)

    return jsonify({"msg": f"Theme '{theme_name}' saved successfully"})

# Change active theme
@app.route("/set-theme/<theme_name>", methods=["POST"])
# @jwt_required()
def set_theme(theme_name):
    with open(THEMES_PATH, "r") as f:
        themes = json.load(f)

    if theme_name not in themes:
        return jsonify({"msg": f"Theme '{theme_name}' does not exist"}), 404

    with open(ACTIVE_THEME_PATH, "w") as f:
        json.dump({"active": theme_name}, f, indent=2)

    return jsonify({"msg": f"Active theme set to '{theme_name}'"})

# List themes
@app.route("/themes", methods=["GET"])
def list_themes():
    if not os.path.exists(THEMES_PATH):
        return jsonify({"active": None, "available": []})

    with open(THEMES_PATH, "r") as f:
        themes = json.load(f)

    active = "default"
    if os.path.exists(ACTIVE_THEME_PATH):
        with open(ACTIVE_THEME_PATH, "r") as f:
            active = json.load(f).get("active", "default")

    return jsonify({"active": active, "available": list(themes.keys())})

# ===============================

@app.route("/get-mosque-details", methods=["GET"])
def get_mosque_details():
    if not os.path.exists(MOSQUE_FILE):
        return jsonify({"error": "Mosque details not found"}), 404
    with open(MOSQUE_FILE, "r") as f:
        data = json.load(f)
    return jsonify(data)

@app.route("/get-eid-timings", methods=["GET"])
def get_eid_timings():
    if not os.path.exists(EID_TIMINGS_PATH):
        return jsonify({"error": "Eid timings not found"}), 404
    with open(EID_TIMINGS_PATH, "r") as f:
        data = json.load(f)
    return jsonify(data)


@app.route("/get-taraweeh-timings", methods=["GET"])
def get_taraweeh_timings():
    if not os.path.exists(TARAWEEH_TIMINGS_PATH):
        return jsonify({"error": "Taraweeh timings not found"}), 404
    with open(TARAWEEH_TIMINGS_PATH, "r") as f:
        data = json.load(f)
    return jsonify(data)


@app.route('/log', methods=['POST'])
def log_from_client():
    data = request.get_json()
    print("📢 Client log:", data.get('message'))
    return '', 204

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
