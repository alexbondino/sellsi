"""
Vercel Serverless Function - Recommendations Endpoint
Handles: POST /api/recommendations
"""
import os
import sys
import json
import asyncio
from pathlib import Path
from http.server import BaseHTTPRequestHandler

# Add recommender module to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path / "recommender"))

from app.services.recommender_service import RecommenderService

recommender_service = RecommenderService()

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        """Handle POST request"""
        try:
            # Parse request body
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            limit = data.get('limit', 10)
            category = data.get('category', None)
            
            # Get recommendations (async)
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            recommendations_list = loop.run_until_complete(
                recommender_service.get_recommendations(
                    limit=limit,
                    category=category
                )
            )
            loop.close()
            
            # Format response
            response_data = {
                "products": recommendations_list,
                "count": len(recommendations_list),
                "strategy": recommender_service.active_strategy
            }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {"error": str(e)}
            self.wfile.write(json.dumps(error_response).encode())
            self.wfile.write(json.dumps(error_response).encode())
