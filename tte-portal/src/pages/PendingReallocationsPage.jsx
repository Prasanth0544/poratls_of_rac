import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import './PendingReallocationsPage.css';

const PendingReallocationsPage = () => {
    const [pendingReallocations, setPendingReallocations] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [rejecting, setRejecting] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchPendingReallocations();

        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchPendingReallocations, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchPendingReallocations = async () => {
        try {
            const res = await apiClient.get('/reallocation/pending');
            setPendingReallocations(res.data.data.reallocations || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching pending reallocations:', error);
            setLoading(false);
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === pendingReallocations.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingReallocations.map(r => r._id));
        }
    };

    const approveBatch = async () => {
        if (selectedIds.length === 0) {
            alert('Please select at least one reallocation to approve');
            return;
        }

        if (!confirm(`Approve ${selectedIds.length} reallocation(s)?`)) {
            return;
        }

        setProcessing(true);
        try {
            const res = await apiClient.post('/reallocation/approve-batch', {
                reallocationIds: selectedIds,
                tteId: 'TTE1' // TODO: Get from auth context
            });

            if (res.data.success) {
                alert(`✅ ${res.data.data.totalApproved} reallocations approved!`);
                setSelectedIds([]);
                fetchPendingReallocations();
            }
        } catch (error) {
            alert('Failed to approve reallocations: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    const rejectReallocation = async (id) => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        setProcessing(true);
        try {
            const res = await apiClient.post(`/reallocation/reject/${id}`, {
                reason: rejectionReason,
                tteId: 'TTE1' // TODO: Get from auth context
            });

            if (res.data.success) {
                alert('✅ Reallocation rejected');
                setRejecting(null);
                setRejectionReason('');
                fetchPendingReallocations();
            }
        } catch (error) {
            alert('Failed to reject reallocation: ' + error.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="pending-reallocations-page">
                <div className="loading">⏳ Loading...</div>
            </div>
        );
    }

    return (
        <div className="pending-reallocations-page">
            {/* Header */}
            <div className="page-header">
                <h1>⏳ Pending RAC Reallocations</h1>
                <div className="header-actions">
                    <span className="pending-count">
                        {pendingReallocations.length} Pending
                    </span>
                    <button className="btn-refresh" onClick={fetchPendingReallocations}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Bulk Actions */}
            {pendingReallocations.length > 0 && (
                <div className="bulk-actions-bar">
                    <div className="select-all">
                        <input
                            type="checkbox"
                            checked={selectedIds.length === pendingReallocations.length}
                            onChange={toggleSelectAll}
                        />
                        <label>
                            Select All ({selectedIds.length} selected)
                        </label>
                    </div>
                    <div className="actions">
                        <button
                            className="btn-approve"
                            onClick={approveBatch}
                            disabled={selectedIds.length === 0 || processing}
                        >
                            ✅ Approve Selected ({selectedIds.length})
                        </button>
                    </div>
                </div>
            )}

            {/* Reallocations List */}
            {pendingReallocations.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">✨</div>
                    <h3>No Pending Reallocations</h3>
                    <p>All reallocations have been processed</p>
                </div>
            ) : (
                <div className="reallocations-grid">
                    {pendingReallocations.map((realloc) => (
                        <div key={realloc._id} className="reallocation-card">
                            {/* Selection Checkbox */}
                            <div className="card-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(realloc._id)}
                                    onChange={() => toggleSelection(realloc._id)}
                                />
                            </div>

                            {/* Card Content */}
                            <div className="card-header">
                                <h3>{realloc.passengerName}</h3>
                                <span className="station-badge">
                                    📍 {realloc.stationName}
                                </span>
                            </div>

                            <div className="card-body">
                                <div className="detail-row">
                                    <span className="label">PNR:</span>
                                    <span className="value">{realloc.passengerPNR}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Journey:</span>
                                    <span className="value">
                                        {realloc.passengerFrom} → {realloc.passengerTo}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Current:</span>
                                    <span className="value  current">
                                        {realloc.currentBerth} ({realloc.currentRAC})
                                    </span>
                                </div>
                                <div className="detail-row highlight">
                                    <span className="label">✨ Proposed:</span>
                                    <span className="value proposed">
                                        {realloc.proposedBerthFull} ({realloc.proposedBerthType})
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Berth Vacant:</span>
                                    <span className="value">
                                        {realloc.berthVacantFrom} → {realloc.berthVacantTo}
                                    </span>
                                </div>
                            </div>

                            {/* Card Actions */}
                            <div className="card-actions">
                                {rejecting === realloc._id ? (
                                    <div className="rejection-form">
                                        <input
                                            type="text"
                                            placeholder="Rejection reason..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            className="btn-confirm-reject"
                                            onClick={() => rejectReallocation(realloc._id)}
                                            disabled={processing}
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            className="btn-cancel"
                                            onClick={() => {
                                                setRejecting(null);
                                                setRejectionReason('');
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            className="btn-approve-single"
                                            onClick={() => {
                                                setSelectedIds([realloc._id]);
                                                approveBatch();
                                            }}
                                            disabled={processing}
                                        >
                                            ✅ Approve
                                        </button>
                                        <button
                                            className="btn-reject"
                                            onClick={() => setRejecting(realloc._id)}
                                            disabled={processing}
                                        >
                                            ❌ Reject
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingReallocationsPage;
