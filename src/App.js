import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

function App() {
  const [visitors, setVisitors] = useState([]);
  const [visitor, setVisitor] = useState({
    name: "",
    email: "",
    phone: "",
    purpose: "",
    checkInTime: "",
    checkOutTime: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL_PRIMARY = "https://visitor-backend-ahfcfyctbfgmcpa6.southeastasia-01.azurewebsites.net/api/visitors";
  const API_URL_FALLBACK = "http://localhost:8083/api/visitors";

  const callApiWithFallback = async (method, path = "", body = null) => {
    const urls = [API_URL_PRIMARY, API_URL_FALLBACK];
    let lastError = null;

    for (const baseUrl of urls) {
      try {
        return await axios({
          method,
          url: path ? `${baseUrl}${path}` : baseUrl,
          data: body,
        });
      } catch (err) {
        lastError = err;
        console.warn(`API fallback attempt failed for ${baseUrl}:`, err.message || err);
      }
    }

    throw lastError;
  };

  const fetchVisitors = useCallback(() => {
    setLoading(true);
    setError(null);

    callApiWithFallback("get")
      .then((res) => {
        setVisitors(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching visitors:", err);
        const errorMsg = err.response?.status
          ? `Server error (${err.response.status}): ${err.response.data?.message || 'Unknown error'}`
          : `Could not connect to the backend. Tried primary: ${API_URL_PRIMARY} and fallback: ${API_URL_FALLBACK}`;
        setError(errorMsg);
        setVisitors([]);
      })
      .finally(() => setLoading(false));
  }, [API_URL_PRIMARY, API_URL_FALLBACK]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // Handle input change
  const handleChange = (e) => {
    setVisitor({ ...visitor, [e.target.name]: e.target.value });
  };

  // Add or Update visitor
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (editingId) {
      callApiWithFallback("put", `/${editingId}`, visitor)
        .then(() => {
          fetchVisitors();
          setVisitor({ name: "", email: "", phone: "", purpose: "", checkInTime: "", checkOutTime: "" });
          setEditingId(null);
        })
        .catch((err) => {
          console.error("Error updating visitor:", err);
          setError("Failed to update visitor. Please try again.");
        });
    } else {
      callApiWithFallback("post", "", visitor)
        .then(() => {
          fetchVisitors();
          setVisitor({ name: "", email: "", phone: "", purpose: "", checkInTime: "", checkOutTime: "" });
        })
        .catch((err) => {
          console.error("Error adding visitor:", err);
          setError("Failed to add visitor. Please try again.");
        });
    }
  };

  // Edit visitor
  const handleEdit = (v) => {
    setVisitor({
      name: v.name,
      email: v.email,
      phone: v.phone,
      purpose: v.purpose,
      checkInTime: v.checkInTime,
      checkOutTime: v.checkOutTime,
    });
    setEditingId(v.id);
  };

  // Delete visitor
  const handleDelete = (id) => {
    callApiWithFallback("delete", `/${id}`)
      .then(() => {
        setVisitors(visitors.filter((v) => v.id !== id));
        setError(null);
      })
      .catch((err) => {
        console.error("Error deleting visitor:", err);
        setError("Failed to delete visitor. Please try again.");
      });
  };

  return (
    <div style={{ margin: "20px" }}>
      <h1>Visitor Entry System</h1>

      {/* Error Message */}
      {error && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "20px",
            border: "1px solid #f5c6cb",
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Loading State */}
      {loading && <p>Loading visitors...</p>}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          name="name"
          value={visitor.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />
        <input
          name="email"
          value={visitor.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        <input
          name="phone"
          value={visitor.phone}
          onChange={handleChange}
          placeholder="Phone"
          required
        />
        <input
          name="purpose"
          value={visitor.purpose}
          onChange={handleChange}
          placeholder="Purpose"
          required
        />
        <input
          name="checkInTime"
          type="datetime-local"
          value={visitor.checkInTime}
          onChange={handleChange}
          placeholder="Check-in Time"
        />
        <input
          name="checkOutTime"
          type="datetime-local"
          value={visitor.checkOutTime}
          onChange={handleChange}
          placeholder="Check-out Time"
        />
        <button type="submit">
          {editingId ? "Update Visitor" : "Add Visitor"}
        </button>
      </form>

      {/* Visitor List */}
      <h2>Visitor List</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Purpose</th>
            <th>Check-in Time</th>
            <th>Check-out Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visitors.map((v) => (
            <tr key={v.id}>
              <td>{v.name}</td>
              <td>{v.email}</td>
              <td>{v.phone}</td>
              <td>{v.purpose}</td>
              <td>{v.checkInTime ? new Date(v.checkInTime).toLocaleString() : '-'}</td>
              <td>{v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : '-'}</td>
              <td>
                <button onClick={() => handleEdit(v)}>Edit</button>
                <button onClick={() => handleDelete(v.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
