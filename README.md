# Housing Price Prediction Dashboard

An interactive web dashboard for exploring and predicting housing prices using machine learning models. Built with FastAPI and modern web technologies.

## Features

- **Interactive Data Exploration**: Visualize housing price distributions, correlations, and geographic patterns
- **Model Comparison**: Compare Linear Regression and Random Forest model performance
- **Real-time Predictions**: Input property characteristics and get instant price predictions
- **Responsive Design**: Works on desktop and mobile devices
- **Professional Visualizations**: Interactive charts using Plotly.js

## Dashboard Sections

### 1. Overview
- Summary statistics and key metrics
- Price distribution histogram
- Feature correlation analysis
- Geographic distribution map

### 2. Analysis
- Scatter plots showing relationships between features and prices
- Distance to MRT vs Price analysis
- House age impact analysis
- Convenience store density analysis

### 3. Models
- Model performance comparison (R² and MSE)
- Feature importance rankings from Random Forest
- Cross-validation results

### 4. Prediction
- Interactive form for inputting property characteristics
- Real-time predictions from both models
- Input validation and error handling

## Technology Stack

- **Backend**: FastAPI (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **Visualizations**: Plotly.js
- **Styling**: Tailwind CSS
- **Icons**: Font Awesome
- **Machine Learning**: scikit-learn
- **Data Processing**: pandas, numpy

## Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Setup

1. **Clone or navigate to the dashboard directory**:
   ```bash
   cd housing_price_prediction/dashboard
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python3 main.py
   ```

4. **Access the dashboard**:
   Open your web browser and navigate to `http://localhost:8000`

## API Endpoints

The dashboard provides a RESTful API with the following endpoints:

- `GET /` - Main dashboard interface
- `GET /api/data/summary` - Dataset summary statistics
- `GET /api/data/correlation` - Feature correlation data
- `GET /api/data/scatter/{feature}` - Scatter plot data for specific features
- `GET /api/data/distribution` - Price distribution data
- `GET /api/data/geographic` - Geographic distribution data
- `GET /api/models/performance` - Model performance metrics
- `GET /api/models/feature_importance` - Feature importance rankings
- `POST /api/predict` - Make price predictions

## Usage

### Making Predictions

1. Navigate to the "Prediction" tab
2. Enter property characteristics:
   - **Transaction Date**: Year in decimal format (e.g., 2013.250 for March 2013)
   - **House Age**: Age of the property in years
   - **Distance to MRT**: Distance to nearest MRT station in meters
   - **Number of Convenience Stores**: Count of nearby convenience stores
   - **Latitude/Longitude**: Geographic coordinates
3. Click "Predict Price" to get predictions from both models

### Exploring Data

- Use the **Overview** tab to understand the dataset structure and distributions
- Switch to **Analysis** tab to explore relationships between variables
- Check the **Models** tab to compare algorithm performance

## Model Information

### Linear Regression
- Simple, interpretable baseline model
- Assumes linear relationships between features and price
- Good for understanding feature coefficients

### Random Forest
- Ensemble method using multiple decision trees
- Captures non-linear relationships and feature interactions
- Provides feature importance rankings
- Generally more accurate than linear regression

## Dataset

The dashboard uses real estate data from Sindian District, New Taipei City, Taiwan:
- **414 property transactions** from 2012-2013
- **6 input features**: transaction date, house age, distance to MRT, convenience stores, latitude, longitude
- **Target variable**: house price per unit area (10,000 NTD/Ping)

## Development

### Project Structure
```
dashboard/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── data/               # Dataset files
├── static/             # Frontend assets
│   ├── index.html      # Main dashboard interface
│   └── dashboard.js    # JavaScript functionality
└── README.md           # This file
```

### Adding New Features

1. **Backend**: Add new endpoints in `main.py`
2. **Frontend**: Update `dashboard.js` for new functionality
3. **UI**: Modify `index.html` for interface changes


## Performance Considerations

- Models are trained once at startup for fast predictions
- Data is cached in memory for quick API responses
- Frontend uses efficient chart libraries for smooth interactions
- Responsive design ensures good performance on all devices

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in `main.py` or kill existing processes
2. **Missing dependencies**: Run `pip install -r requirements.txt`
3. **Data file not found**: Ensure the Excel file is in the `data/` directory
4. **Charts not loading**: Check browser console for JavaScript errors


