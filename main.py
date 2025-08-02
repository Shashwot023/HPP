from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import json
import plotly.graph_objects as go
import plotly.express as px
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
from pydantic import BaseModel
import os

app = FastAPI(title="Housing Price Prediction Dashboard", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Global variables to store data and models
df = None
linear_model = None
rf_model = None
X_test = None
y_test = None

class PredictionRequest(BaseModel):
    transaction_date: float
    house_age: float
    distance_to_mrt: float
    num_convenience_stores: int
    latitude: float
    longitude: float

def load_data():
    """Load and preprocess the housing data"""
    global df, linear_model, rf_model, X_test, y_test
    
    # Load the dataset
    df = pd.read_excel('data/Real estate valuation data set.xlsx')
    
    # Rename columns for better readability
    df.columns = [
        'No', 'transaction_date', 'house_age', 'distance_to_mrt',
        'num_convenience_stores', 'latitude', 'longitude', 'price_per_unit_area'
    ]
    
    # Prepare features and target
    X = df[['transaction_date', 'house_age', 'distance_to_mrt', 
            'num_convenience_stores', 'latitude', 'longitude']]
    y = df['price_per_unit_area']
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train models
    linear_model = LinearRegression()
    linear_model.fit(X_train, y_train)
    
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X_train, y_train)

@app.on_event("startup")
async def startup_event():
    """Load data and train models on startup"""
    load_data()

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the main dashboard page"""
    return FileResponse('static/index.html')

@app.get("/api/data/summary")
async def get_data_summary():
    """Get summary statistics of the dataset"""
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    summary = {
        "total_records": len(df),
        "price_stats": {
            "mean": float(df['price_per_unit_area'].mean()),
            "median": float(df['price_per_unit_area'].median()),
            "min": float(df['price_per_unit_area'].min()),
            "max": float(df['price_per_unit_area'].max()),
            "std": float(df['price_per_unit_area'].std())
        },
        "feature_stats": {
            "avg_house_age": float(df['house_age'].mean()),
            "avg_distance_to_mrt": float(df['distance_to_mrt'].mean()),
            "avg_convenience_stores": float(df['num_convenience_stores'].mean())
        }
    }
    return summary

@app.get("/api/data/correlation")
async def get_correlation_data():
    """Get correlation data for visualization"""
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    # Calculate correlations with price
    features = ['transaction_date', 'house_age', 'distance_to_mrt', 
                'num_convenience_stores', 'latitude', 'longitude']
    
    correlations = []
    for feature in features:
        corr = df[feature].corr(df['price_per_unit_area'])
        correlations.append({
            "feature": feature.replace('_', ' ').title(),
            "correlation": float(corr)
        })
    
    return correlations

@app.get("/api/data/scatter/{feature}")
async def get_scatter_data(feature: str):
    """Get scatter plot data for a specific feature vs price"""
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    if feature not in df.columns:
        raise HTTPException(status_code=400, detail="Invalid feature")
    
    data = []
    for _, row in df.iterrows():
        data.append({
            "x": float(row[feature]),
            "y": float(row['price_per_unit_area'])
        })
    
    return {
        "feature": feature.replace('_', ' ').title(),
        "data": data
    }

@app.get("/api/data/distribution")
async def get_price_distribution():
    """Get price distribution data"""
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    # Create histogram data
    hist, bin_edges = np.histogram(df['price_per_unit_area'], bins=20)
    
    distribution = []
    for i in range(len(hist)):
        distribution.append({
            "bin_start": float(bin_edges[i]),
            "bin_end": float(bin_edges[i+1]),
            "count": int(hist[i])
        })
    
    return distribution

@app.get("/api/models/performance")
async def get_model_performance():
    """Get model performance metrics"""
    if linear_model is None or rf_model is None:
        raise HTTPException(status_code=500, detail="Models not trained")
    
    # Make predictions
    linear_pred = linear_model.predict(X_test)
    rf_pred = rf_model.predict(X_test)
    
    # Calculate metrics
    linear_mse = mean_squared_error(y_test, linear_pred)
    linear_r2 = r2_score(y_test, linear_pred)
    
    rf_mse = mean_squared_error(y_test, rf_pred)
    rf_r2 = r2_score(y_test, rf_pred)
    
    return {
        "linear_regression": {
            "mse": float(linear_mse),
            "r2": float(linear_r2)
        },
        "random_forest": {
            "mse": float(rf_mse),
            "r2": float(rf_r2)
        }
    }

@app.get("/api/models/feature_importance")
async def get_feature_importance():
    """Get feature importance from Random Forest model"""
    if rf_model is None:
        raise HTTPException(status_code=500, detail="Random Forest model not trained")
    
    features = ['transaction_date', 'house_age', 'distance_to_mrt', 
                'num_convenience_stores', 'latitude', 'longitude']
    
    importance_data = []
    for feature, importance in zip(features, rf_model.feature_importances_):
        importance_data.append({
            "feature": feature.replace('_', ' ').title(),
            "importance": float(importance * 100)  # Convert to percentage
        })
    
    # Sort by importance
    importance_data.sort(key=lambda x: x['importance'], reverse=True)
    
    return importance_data

@app.post("/api/predict")
async def predict_price(request: PredictionRequest):
    """Predict housing price based on input features"""
    if linear_model is None or rf_model is None:
        raise HTTPException(status_code=500, detail="Models not trained")
    
    # Prepare input data
    input_data = np.array([[
        request.transaction_date,
        request.house_age,
        request.distance_to_mrt,
        request.num_convenience_stores,
        request.latitude,
        request.longitude
    ]])
    
    # Make predictions
    linear_pred = linear_model.predict(input_data)[0]
    rf_pred = rf_model.predict(input_data)[0]
    
    return {
        "linear_regression_prediction": float(linear_pred),
        "random_forest_prediction": float(rf_pred),
        "input_features": {
            "transaction_date": request.transaction_date,
            "house_age": request.house_age,
            "distance_to_mrt": request.distance_to_mrt,
            "num_convenience_stores": request.num_convenience_stores,
            "latitude": request.latitude,
            "longitude": request.longitude
        }
    }

@app.get("/api/data/geographic")
async def get_geographic_data():
    """Get geographic distribution of properties"""
    if df is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    geographic_data = []
    for _, row in df.iterrows():
        geographic_data.append({
            "latitude": float(row['latitude']),
            "longitude": float(row['longitude']),
            "price": float(row['price_per_unit_area']),
            "house_age": float(row['house_age']),
            "distance_to_mrt": float(row['distance_to_mrt']),
            "convenience_stores": int(row['num_convenience_stores'])
        })
    
    return geographic_data

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)

