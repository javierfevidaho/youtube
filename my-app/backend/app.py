from flask import Flask, jsonify
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from flask_cors import CORS

import os
import pickle

# Configuración
CLIENT_SECRET_FILE = "client_secret.json"
TOKEN_FILE = "token.pickle"  # Archivo para guardar las credenciales
SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"]
CHANNEL_ID = "UCg-dmb3hUcj4f0LH5GE8W0A"

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # Solo para desarrollo

app = Flask(__name__)
CORS(app)

def authenticate_youtube():
    """Autenticar y obtener un cliente de la API de YouTube."""
    credentials = None

    # Cargar credenciales guardadas si existen
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'rb') as token:
            credentials = pickle.load(token)

    # Refrescar credenciales si han expirado
    if credentials and credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())

    # Si no hay credenciales válidas, iniciar el flujo de autenticación
    if not credentials or not credentials.valid:
        flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
        credentials = flow.run_local_server(port=0)

        # Guardar credenciales para uso futuro
        with open(TOKEN_FILE, 'wb') as token:
            pickle.dump(credentials, token)

    return build("youtube", "v3", credentials=credentials)

@app.route('/api/videos', methods=['GET'])
def get_videos():
    """Obtener información del canal y sus videos."""
    try:
        youtube = authenticate_youtube()

        # Obtener información del canal
        channel_response = youtube.channels().list(
            part="snippet,statistics",
            id=CHANNEL_ID
        ).execute()

        channel_info = channel_response['items'][0]
        channel_name = channel_info['snippet']['title']
        channel_stats = channel_info['statistics']

        videos = []
        total_views = 0

        # Obtener los videos del canal
        search_request = youtube.search().list(
            part="id,snippet",
            channelId=CHANNEL_ID,
            type="video",
            maxResults=50
        )

        while search_request:
            search_response = search_request.execute()
            video_ids = [item['id']['videoId'] for item in search_response.get('items', [])]

            if video_ids:
                videos_response = youtube.videos().list(
                    part="snippet,statistics,contentDetails",
                    id=','.join(video_ids)
                ).execute()

                for video in videos_response['items']:
                    video_id = video['id']
                    snippet = video['snippet']
                    stats = video['statistics']

                    views = int(stats.get('viewCount', 0))
                    likes = int(stats.get('likeCount', 0))

                    videos.append({
                        "title": snippet['title'],
                        "description": snippet['description'],
                        "thumbnail": snippet['thumbnails']['high']['url'],
                        "publishedAt": snippet['publishedAt'],
                        "views": views,
                        "likes": likes,
                        "videoId": video_id,
                        "youtubeUrl": f"https://www.youtube.com/watch?v={video_id}",
                        "duration": video['contentDetails']['duration']
                    })
                    total_views += views

            search_request = youtube.search().list_next(search_request, search_response)

        # Ordenar videos por vistas (más vistos primero)
        videos.sort(key=lambda x: x['views'], reverse=True)

        return jsonify({
            "channelInfo": {
                "name": channel_name,
                "totalViews": int(channel_stats.get('viewCount', 0)),
                "subscriberCount": int(channel_stats.get('subscriberCount', 0)),
                "videoCount": int(channel_stats.get('videoCount', 0))
            },
            "videos": videos,
            "totalViews": total_views
        })

    except Exception as e:
        print(f"Error al obtener datos: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
