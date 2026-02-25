from flask import Flask

app = Flask(__name__)

@app.route('/api/health', methods=['GET'])
def health():
    return {'status': 'ok'}

if __name__ == '__main__':
    app.run(debug=True, port=5000)
