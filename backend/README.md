# Financial Modeling API Backend

FastAPI backend for the 3-Statement Financial Model application.

## Features

- **3-Statement Model Calculations**: Complete financial statement calculations
- **Variable Management**: CRUD operations for financial model variables
- **Excel Import**: Import financial data from Excel files
- **Real-time Calculations**: Instant financial projections and KPIs
- **RESTful API**: Clean, documented API endpoints

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Server

```bash
# Option 1: Using the startup script
python start.py

# Option 2: Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Access the API

- **API Base URL**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Model Variables
- `GET /api/v1/models/{model_id}/variables` - Get model variables
- `POST /api/v1/models/{model_id}/variables` - Save model variables
- `POST /api/v1/models/{model_id}/sections/{section_id}/variables` - Add variable
- `PUT /api/v1/models/{model_id}/sections/{section_id}/variables/{variable_id}` - Update variable
- `DELETE /api/v1/models/{model_id}/sections/{section_id}/variables/{variable_id}` - Delete variable

### Calculations
- `POST /api/v1/models/{model_id}/calculate` - Calculate financial model
- `GET /api/v1/models/{model_id}/results` - Get calculation results

### Data Import
- `POST /api/v1/models/{model_id}/import` - Import Excel data

## Supported Models

Currently supports:
- **3-Statement Model**: Complete financial statements (Income Statement, Balance Sheet, Cash Flow)

## Architecture

```
backend/
├── main.py                 # FastAPI application entry point
├── core/
│   └── config.py          # Configuration settings
├── models/
│   └── financial_models.py # Pydantic data models
├── services/
│   ├── financial_calculator.py # Calculation engine
│   └── variable_service.py     # Variable management
└── api/
    └── routes.py          # API endpoints
```

## Development

The backend is designed to be easily extensible:

1. **Add New Models**: Create new calculation services
2. **Database Integration**: Replace in-memory storage with database
3. **Authentication**: Add user authentication and authorization
4. **Advanced Calculations**: Extend the financial calculator

## Testing

Test the API using the interactive documentation at http://localhost:8000/docs 