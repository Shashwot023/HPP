// Dashboard JavaScript functionality
class HousingDashboard {
    constructor() {
        this.baseURL = '';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadSummaryData();
        await this.loadOverviewCharts();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Prediction form
        document.getElementById('prediction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.makePrediction();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active', 'border-blue-500', 'text-blue-600');
            button.classList.add('border-transparent', 'text-gray-500');
        });
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active', 'border-blue-500', 'text-blue-600');
        document.querySelector(`[data-tab="${tabName}"]`).classList.remove('border-transparent', 'text-gray-500');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');

        // Load tab-specific data
        this.loadTabData(tabName);
    }

    async loadTabData(tabName) {
        switch(tabName) {
            case 'analysis':
                await this.loadAnalysisCharts();
                break;
            case 'models':
                await this.loadModelCharts();
                break;
        }
    }

    async loadSummaryData() {
        try {
            const response = await fetch(`${this.baseURL}/api/data/summary`);
            const data = await response.json();
            
            document.getElementById('total-records').textContent = data.total_records;
            document.getElementById('avg-price').textContent = `$${data.price_stats.mean.toFixed(1)}K`;
            document.getElementById('avg-age').textContent = `${data.feature_stats.avg_house_age.toFixed(1)} yrs`;
            document.getElementById('avg-distance').textContent = `${data.feature_stats.avg_distance_to_mrt.toFixed(0)}m`;
        } catch (error) {
            console.error('Error loading summary data:', error);
        }
    }

    async loadOverviewCharts() {
        await Promise.all([
            this.loadPriceDistribution(),
            this.loadCorrelationChart(),
            this.loadGeographicChart()
        ]);
    }

    async loadPriceDistribution() {
        try {
            const response = await fetch(`${this.baseURL}/api/data/distribution`);
            const data = await response.json();
            
            const trace = {
                x: data.map(d => (d.bin_start + d.bin_end) / 2),
                y: data.map(d => d.count),
                type: 'bar',
                marker: {
                    color: '#3B82F6'
                }
            };

            const layout = {
                title: 'Distribution of Housing Prices',
                xaxis: { title: 'Price (10000 NTD/Ping)' },
                yaxis: { title: 'Frequency' },
                margin: { t: 50, r: 50, b: 50, l: 50 }
            };

            Plotly.newPlot('price-distribution-chart', [trace], layout, {responsive: true});
        } catch (error) {
            console.error('Error loading price distribution:', error);
        }
    }

    async loadCorrelationChart() {
        try {
            const response = await fetch(`${this.baseURL}/api/data/correlation`);
            const data = await response.json();
            
            const trace = {
                x: data.map(d => d.correlation),
                y: data.map(d => d.feature),
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: data.map(d => d.correlation >= 0 ? '#10B981' : '#EF4444')
                }
            };

            const layout = {
                title: 'Feature Correlation with Price',
                xaxis: { title: 'Correlation Coefficient', range: [-1, 1] },
                margin: { t: 50, r: 50, b: 50, l: 150 }
            };

            Plotly.newPlot('correlation-chart', [trace], layout, {responsive: true});
        } catch (error) {
            console.error('Error loading correlation chart:', error);
        }
    }

    async loadGeographicChart() {
        try {
            const response = await fetch(`${this.baseURL}/api/data/geographic`);
            const data = await response.json();
            
            const trace = {
                lat: data.map(d => d.latitude),
                lon: data.map(d => d.longitude),
                mode: 'markers',
                type: 'scattermapbox',
                marker: {
                    size: 8,
                    color: data.map(d => d.price),
                    colorscale: 'Viridis',
                    showscale: true,
                    colorbar: {
                        title: 'Price (10000 NTD/Ping)'
                    }
                },
                text: data.map(d => `Price: ${d.price.toFixed(1)}<br>Age: ${d.house_age.toFixed(1)} yrs<br>Distance to MRT: ${d.distance_to_mrt.toFixed(0)}m`),
                hovertemplate: '%{text}<extra></extra>'
            };

            const layout = {
                mapbox: {
                    style: 'open-street-map',
                    center: {
                        lat: data.reduce((sum, d) => sum + d.latitude, 0) / data.length,
                        lon: data.reduce((sum, d) => sum + d.longitude, 0) / data.length
                    },
                    zoom: 12
                },
                margin: { t: 0, r: 0, b: 0, l: 0 },
                height: 400
            };

            Plotly.newPlot('geographic-chart', [trace], layout, {responsive: true});
        } catch (error) {
            console.error('Error loading geographic chart:', error);
        }
    }

    async loadAnalysisCharts() {
        await Promise.all([
            this.loadScatterChart('distance_to_mrt', 'distance-scatter-chart'),
            this.loadScatterChart('house_age', 'age-scatter-chart'),
            this.loadScatterChart('num_convenience_stores', 'stores-scatter-chart'),
            this.loadLocationAnalysis()
        ]);
    }

    async loadScatterChart(feature, chartId) {
        try {
            const response = await fetch(`${this.baseURL}/api/data/scatter/${feature}`);
            const data = await response.json();
            
            const trace = {
                x: data.data.map(d => d.x),
                y: data.data.map(d => d.y),
                mode: 'markers',
                type: 'scatter',
                marker: {
                    color: '#3B82F6',
                    size: 6
                }
            };

            const layout = {
                title: `${data.feature} vs Price`,
                xaxis: { title: data.feature },
                yaxis: { title: 'Price (10000 NTD/Ping)' },
                margin: { t: 50, r: 50, b: 50, l: 50 }
            };

            Plotly.newPlot(chartId, [trace], layout, {responsive: true});
        } catch (error) {
            console.error(`Error loading scatter chart for ${feature}:`, error);
        }
    }

    async loadLocationAnalysis() {
        try {
            const response = await fetch(`${this.baseURL}/api/data/geographic`);
            const data = await response.json();
            
            // Create a heatmap-style visualization
            const trace = {
                x: data.map(d => d.longitude),
                y: data.map(d => d.latitude),
                z: data.map(d => d.price),
                type: 'scatter',
                mode: 'markers',
                marker: {
                    size: 8,
                    color: data.map(d => d.price),
                    colorscale: 'Viridis',
                    showscale: true,
                    colorbar: {
                        title: 'Price'
                    }
                }
            };

            const layout = {
                title: 'Price by Geographic Location',
                xaxis: { title: 'Longitude' },
                yaxis: { title: 'Latitude' },
                margin: { t: 50, r: 50, b: 50, l: 50 }
            };

            Plotly.newPlot('location-analysis-chart', [trace], layout, {responsive: true});
        } catch (error) {
            console.error('Error loading location analysis:', error);
        }
    }

    async loadModelCharts() {
        await Promise.all([
            this.loadModelPerformance(),
            this.loadFeatureImportance()
        ]);
    }

    async loadModelPerformance() {
        try {
            const response = await fetch(`${this.baseURL}/api/models/performance`);
            const data = await response.json();
            
            const trace1 = {
                x: ['Linear Regression', 'Random Forest'],
                y: [data.linear_regression.r2, data.random_forest.r2],
                name: 'R² Score',
                type: 'bar',
                marker: { color: '#10B981' }
            };

            const trace2 = {
                x: ['Linear Regression', 'Random Forest'],
                y: [data.linear_regression.mse, data.random_forest.mse],
                name: 'MSE',
                type: 'bar',
                yaxis: 'y2',
                marker: { color: '#EF4444' }
            };

            const layout = {
                title: 'Model Performance Comparison',
                yaxis: { title: 'R² Score', side: 'left' },
                yaxis2: { title: 'Mean Squared Error', side: 'right', overlaying: 'y' },
                margin: { t: 50, r: 50, b: 50, l: 50 }
            };

            Plotly.newPlot('model-performance-chart', [trace1, trace2], layout, {responsive: true});
        } catch (error) {
            console.error('Error loading model performance:', error);
        }
    }

    async loadFeatureImportance() {
        try {
            const response = await fetch(`${this.baseURL}/api/models/feature_importance`);
            const data = await response.json();
            
            const trace = {
                x: data.map(d => d.importance),
                y: data.map(d => d.feature),
                type: 'bar',
                orientation: 'h',
                marker: { color: '#8B5CF6' }
            };

            const layout = {
                title: 'Feature Importance (Random Forest)',
                xaxis: { title: 'Importance (%)' },
                margin: { t: 50, r: 50, b: 50, l: 150 }
            };

            Plotly.newPlot('feature-importance-chart', [trace], layout, {responsive: true});
        } catch (error) {
            console.error('Error loading feature importance:', error);
        }
    }

    async makePrediction() {
        try {
            const formData = {
                transaction_date: parseFloat(document.getElementById('transaction_date').value),
                house_age: parseFloat(document.getElementById('house_age').value),
                distance_to_mrt: parseFloat(document.getElementById('distance_to_mrt').value),
                num_convenience_stores: parseInt(document.getElementById('num_convenience_stores').value),
                latitude: parseFloat(document.getElementById('latitude').value),
                longitude: parseFloat(document.getElementById('longitude').value)
            };

            const response = await fetch(`${this.baseURL}/api/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            const resultsDiv = document.getElementById('prediction-results');
            resultsDiv.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-blue-100 p-4 rounded-lg">
                        <h4 class="font-semibold text-blue-800">Linear Regression</h4>
                        <p class="text-2xl font-bold text-blue-600">$${data.linear_regression_prediction.toFixed(1)}K</p>
                        <p class="text-sm text-blue-600">per unit area</p>
                    </div>
                    <div class="bg-green-100 p-4 rounded-lg">
                        <h4 class="font-semibold text-green-800">Random Forest</h4>
                        <p class="text-2xl font-bold text-green-600">$${data.random_forest_prediction.toFixed(1)}K</p>
                        <p class="text-sm text-green-600">per unit area</p>
                    </div>
                </div>
                <div class="mt-4 p-4 bg-gray-100 rounded-lg">
                    <h4 class="font-semibold text-gray-800 mb-2">Input Summary</h4>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>House Age: ${formData.house_age} years</div>
                        <div>Distance to MRT: ${formData.distance_to_mrt}m</div>
                        <div>Convenience Stores: ${formData.num_convenience_stores}</div>
                        <div>Location: ${formData.latitude.toFixed(3)}, ${formData.longitude.toFixed(3)}</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error making prediction:', error);
            document.getElementById('prediction-results').innerHTML = `
                <div class="text-red-600">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Error making prediction. Please check your inputs and try again.
                </div>
            `;
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new HousingDashboard();
});

