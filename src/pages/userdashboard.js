"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const UserDashboard = () => {
  const { user, token } = useAuth();
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchViolations = async () => {
      try {
        const response = await fetch("http://localhost:8000/user/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch violation history.");
        }

        const data = await response.json();
        const sorted = data.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setViolations(sorted);
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchViolations();
    }
  }, [token]);

  const handleBack = () => {
    navigate("/ppe-detection");
  };

  return (
    <div className="dashboard-container" style={{ padding: "2rem" }}>
      <h1>User Dashboard</h1>
      <p>
        Hello, <strong>{user?.username}</strong>. Here is your violation history:
      </p>

      <button
        onClick={handleBack}
        style={{
          marginBottom: "1rem",
          padding: "8px 16px",
          borderRadius: "6px",
          backgroundColor: "#3b82f6",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        ⬅ Back to Detection
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && violations.length === 0 && <p>No violations recorded yet.</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={cellStyle}>#</th>
            <th style={cellStyle}>Label</th>
            <th style={cellStyle}>Confidence</th>
            <th style={cellStyle}>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {violations.map((v, index) => (
            <tr key={v.id || index}>
              <td style={cellStyle}>{index + 1}</td>
              <td style={cellStyle}>{v.label}</td>
              <td style={cellStyle}>{v.confidence}</td>
              <td style={cellStyle}>
                {new Date(v.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const cellStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  textAlign: "left",
};

export default UserDashboard;
