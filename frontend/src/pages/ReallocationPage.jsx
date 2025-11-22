import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './ReallocationPage.css';

const ReallocationPage = ({ trainData, loadTrainState, onClose }) => {
    const [trainState, setTrainState] = useState(null);
    const [eligibilityMatrix, setEligibilityMatrix] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all data
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        await Promise.all([
            fetchTrainState(),
            fetchEligibilityMatrix()
        ]);
        setLoading(false);
    };

    const fetchTrainState = async () => {
        try {
            const res = await api.get('/train/state');
            setTrainState(res.data.data);
        } catch (error) {
            console.error('Error fetching train state:', error);
        }
    };

    const fetchEligibilityMatrix = async () => {
        try {
            const res = await api.get('/reallocation/eligibility');
            // Backend returns: { data: { eligibility: [...] } }
            const matrixData = res.data.data?.eligibility || res.data.data;
            setEligibilityMatrix(Array.isArray(matrixData) ? matrixData : []);
        } catch (error) {
            console.error('Error fetching eligibility matrix:', error);
        }
    };

    if (loading) {
        return (
            <div className="reallocation-page">
                <div className="loading">Loading reallocation data...</div>
            </div>
        );
    }

    return (
        <div className="reallocation-page">
            <div className="page-header">
                <button className="back-btn" onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1>🔄 Dynamic RAC Reallocation System</h1>
                <div className="train-info">
                    {trainState && (
                        <>
                            <span className="train-name">{trainState.trainName}</span>
                            <span className="train-no">#{trainState.trainNo}</span>
                            <span className="current-station">
                                📍 {trainState.stations[trainState.currentStationIdx]?.name}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Eligibility Matrix Section */}
            <div className="matrix-section">
                <h2>✅ Eligibility Matrix</h2>
                <p className="matrix-description">
                    Shows which RAC passengers are eligible for which vacant berths based on journey coverage
                </p>
                {eligibilityMatrix.length === 0 ? (
                    <div className="empty-state">No eligibility data available. Click "Refresh" to check.</div>
                ) : (
                    <div className="eligibility-grid">
                        {eligibilityMatrix.map((item, index) => {
                            const passenger = item.topEligible || {};
                            const isEligible = !!item.topEligible;
                            return (
                                <div key={index} className={`eligibility-card ${isEligible ? 'eligible' : 'not-eligible'}`}>
                                    <div className="eligibility-header">
                                        <h4>{passenger.name || 'Unknown'} ({passenger.pnr || 'N/A'})</h4>
                                        <span className={`status ${isEligible ? 'eligible' : 'not-eligible'}`}>
                                            {isEligible ? '✓ ELIGIBLE' : '✗ NOT ELIGIBLE'}
                                        </span>
                                    </div>
                                    <div className="eligibility-details">
                                        <p><strong>Berth:</strong> {item.coach}-{item.berthNo} ({item.type})</p>
                                        <p><strong>Passenger Journey:</strong> {passenger.from} → {passenger.to}</p>
                                        <p><strong>Vacant Segment:</strong> {item.vacantFrom} → {item.vacantTo}</p>
                                        {!isEligible && (
                                            <p className="reason"><strong>Reason:</strong> No eligible passengers found</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <button className="btn-primary refresh-btn" onClick={fetchEligibilityMatrix}>
                    🔄 Refresh Matrix
                </button>
            </div>
        </div>
    );
};

export default ReallocationPage;
