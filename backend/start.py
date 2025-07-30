#!/usr/bin/env python3
"""
Startup script for the Financial Modeling API
"""

import uvicorn
from main import app

if __name__ == "__main__":
    print("🚀 Starting Financial Modeling API...")
    print("📊 Backend will be available at: http://localhost:8000")
    print("📚 API Documentation at: http://localhost:8000/docs")
    print("🔧 Health check at: http://localhost:8000/health")
    print("=" * 50)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 