"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from '../context/AuthContext';
import "./admindashboard.css"

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeViolations: 0,
    complianceRate: 100,
  })

  useEffect(async () => {
    // Redirect if not admin
    if (user && user.role !== "admin") {
      navigate("/", { replace: true })
      return
    }

const response = await fetch("http://localhost:8000/admin/users", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
})
const userData = await response.json()
setUsers(userData)


    // Load users data - ready for backend integration
    const loadUsers = async () => {
  try {
    const token = user?.token;

    const response = await fetch("http://127.0.0.1:8000/admin/summary", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = await response.json();
    setUsers(userData);

    setStats({
      totalUsers: userData.length,
      activeViolations: userData.reduce((sum, u) => sum + u.violation_count, 0),
      complianceRate:
        userData.length > 0
          ? Math.round((userData.filter((u) => u.violation_count === 0).length / userData.length) * 100)
          : 100,
    });

    setLoading(false);
  } catch (error) {
    console.error("Error loading users:", error);
    setLoading(false);
  }
};


    loadUsers()
  }, [user, navigate])

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        // TODO: Replace with actual API call
        // await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });

        console.log("Delete user:", userId)
        // Refresh data after deletion
        // loadUsers();
      } catch (error) {
        console.error("Error deleting user:", error)
      }
    }
  }

  const handleChangeRole = async (userId) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/admin/users/${userId}/role`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ role: 'newRole' })
      // });

      console.log("Change role for user:", userId)
      // Refresh data after role change
      // loadUsers();
    } catch (error) {
      console.error("Error changing user role:", error)
    }
  }

  const handleViewViolations = (userId) => {
    // TODO: Navigate to user violations page or open modal
    console.log("View violations for user:", userId)
    // navigate(`/admin/users/${userId}/violations`);
  }

  const handleAddUser = () => {
    // TODO: Open add user modal or navigate to add user page
    console.log("Add new user")
  }

  const handleExportData = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/export');
      // const blob = await response.blob();

      console.log("Export data")
      // Create and download file
    } catch (error) {
      console.error("Error exporting data:", error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  if (!user || user.role !== "admin") {
    return <div>Access denied. Redirecting...</div>
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="admin-title">Admin Dashboard</h1>
            <div className="welcome-section">
              <span className="welcome-text">Welcome, </span>
              <span className="admin-name">{user.name}</span>
              <span className="admin-badge">Admin</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => navigate("/ppe-detection")}>
              PPE Detection
            </button>
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        <div className="content-container">
          {/* Stats Section */}
          <div className="stats-section">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>Total Users</h3>
                <p className="stat-number">{stats.totalUsers}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-info">
                <h3>Active Violations</h3>
                <p className="stat-number">{stats.activeViolations}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>Compliance Rate</h3>
                <p className="stat-number">{stats.complianceRate}%</p>
              </div>
            </div>
          </div>

          {/* User PPE Stats Table */}
          <div className="table-section">
            <div className="table-header">
              <h2>User PPE Stats</h2>
              <div className="table-actions">
                <button className="btn btn-primary" onClick={handleAddUser}>
                  Add User
                </button>
                <button className="btn btn-secondary" onClick={handleExportData}>
                  Export Data
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>All Good</th>
                    <th>Violations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="loading-cell">
                        <div className="loading-spinner"></div>
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-cell">
                        <div className="empty-state">
                          <div className="empty-icon">👥</div>
                          <h3>No Users Found</h3>
                          <p>Users will appear here once they start using the PPE detection system.</p>
                          <p className="backend-note">Ready for backend integration</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="user-row">
                        <td className="user-cell">
                          <div className="user-info">
                            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                            <div className="user-details">
                              <span className="user-name">{user.name}</span>
                              <span className="user-email">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="stat-cell">
                          <span className="stat-badge good">{user.allGood || 0}</span>
                        </td>
                        <td className="stat-cell">
                          <span className="stat-badge violations">{user.violations || 0}</span>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="action-btn delete"
                              onClick={() => handleDelete(user.id)}
                              title="Delete User"
                            >
                              Delete
                            </button>
                            <button
                              className="action-btn change-role"
                              onClick={() => handleChangeRole(user.id)}
                              title="Change Role"
                            >
                              Change Role
                            </button>
                            <button
                              className="action-btn view-violations"
                              onClick={() => handleViewViolations(user.id)}
                              title="View Violations"
                            >
                              View Violations
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard