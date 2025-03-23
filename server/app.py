from flask import Flask, jsonify, request
from smartcard.System import readers
from smartcard.util import toHexString, toBytes
import nfc
from flask_cors import CORS


app = Flask(__name__)
connection = None
CORS(app)

@app.route("/read")
def read_tag():
    global connection
    if not connection:
        return jsonify({"error": "No active connection. Call /create first"}), 400
    try:
        data = nfc.read(connection)
        return jsonify({"data": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/write", methods=["POST"])
def write_tag():
    global connection
    if not connection:
        return jsonify({"error": "No active connection. Call /create first"}), 400
    
    try:
        data = request.get_json()  # Parse JSON body
        msg = data.get("message")
        if not msg:
            return jsonify({"error": "No message provided"}), 400
        
        nfc.write(connection, msg)
        return jsonify({"success": True, "message": f"Wrote: {msg}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/create")
def create_connection():
    global connection
    try:
        connection = nfc.init_reader()
        return jsonify({"success": True, "message": "NFC reader connected"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/disconnect")
def disconnect_reader():
    global connection
    if not connection:
        return jsonify({"error": "No active connection"}), 400
    
    try:
        nfc.disconnect(connection)
        connection = None
        return jsonify({"success": True, "message": "NFC reader disconnected"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/poll")
def poll_reader():
    global connection
    if not connection:
        return jsonify({"error": "No active connection. Call /create first"}), 400
    
    try:
        # Simple poll to check if card is still present
        # Just read the first page to see if connection is alive
        nfc.read(connection, num_pages=1, start_page=4)
        return jsonify({"success": True, "status": "Card is present"})
    except Exception as e:
        return jsonify({"error": str(e), "status": "Card not present or error occurred"}), 500

@app.route("/status")
def reader_status():
    global connection
    if connection:
        return jsonify({"status": "connected"})
    else:
        return jsonify({"status": "disconnected"})

if __name__ == "__main__":
    app.run(port=8088, debug=True)
