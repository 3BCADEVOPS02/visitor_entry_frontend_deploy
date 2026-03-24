import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

function App() {
  const [visitors, setVisitors] = useState([]);
  const [visitor, setVisitor] = useState({
    name: "",
    email: "",
    phone: "",
    purpose: "",
    toMeet: "",
    checkInTime: "",
    checkOutTime: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL_PRIMARY =
    "https://visitor-backend-ahfcfyctbfgmcpa6.southeastasia-01.azurewebsites.net/api/visitors";
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
        console.warn(
          `API fallback attempt failed for ${baseUrl}:`,
          err.message || err
        );
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
          ? `Server error (${err.response.status}): ${
              err.response.data?.message || "Unknown error"
            }`
          : `Could not connect to the backend. Tried primary and fallback.`;
        setError(errorMsg);
        setVisitors([]);
      })
      .finally(() => setLoading(false));
  }, []);

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
          resetForm();
        })
        .catch(() => {
          setError("Failed to update visitor.");
        });
    } else {
      callApiWithFallback("post", "", visitor)
        .then(() => {
          fetchVisitors();
          resetForm();
        })
        .catch(() => {
          setError("Failed to add visitor.");
        });
    }
  };

  const resetForm = () => {
    setVisitor({
      name: "",
      email: "",
      phone: "",
      purpose: "",
      toMeet: "",
      checkInTime: "",
      checkOutTime: "",
    });
    setEditingId(null);
  };

  // Edit visitor
  const handleEdit = (v) => {
    setVisitor({
      name: v.name,
      email: v.email,
      phone: v.phone,
      purpose: v.purpose,
      toMeet: v.toMeet || "",
      checkInTime: v.checkInTime,
      checkOutTime: v.checkOutTime,
    });
    setEditingId(v.id);
  };

  // Delete visitor
  const handleDelete = (id) => {
    const password = prompt("Enter password to delete:");

    if (password !== "2006") {
      alert("Incorrect password.");
      return;
    }

    callApiWithFallback("delete", `/${id}`)
      .then(() => {
        setVisitors(visitors.filter((v) => v.id !== id));
      })
      .catch(() => {
        setError("Failed to delete visitor.");
      });
  };

  // TO MEET button action
  const handleToMeet = (v) => {
    alert(`Visitor ${v.name} wants to meet ${v.toMeet}`);
  };

  return (
    <div style={{ margin: "20px" }}>
      <h1>Visitor Entry System</h1>

      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          ❌ {error}
        </div>
      )}

      {loading && <p>Loading visitors...</p>}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input name="name" value={visitor.name} onChange={handleChange} placeholder="Name" required />
        <input name="email" value={visitor.email} onChange={handleChange} placeholder="Email" required />
        <input name="phone" value={visitor.phone} onChange={handleChange} placeholder="Phone" required />
        <input name="purpose" value={visitor.purpose} onChange={handleChange} placeholder="Purpose" required />

        {/* NEW FIELD */}
        <input name="toMeet" value={visitor.toMeet} onChange={handleChange} placeholder="To Meet" required />

        <input type="datetime-local" name="checkInTime" value={visitor.checkInTime} onChange={handleChange} />
        <input type="datetime-local" name="checkOutTime" value={visitor.checkOutTime} onChange={handleChange} />

        <button type="submit">
          {editingId ? "Update Visitor" : "Add Visitor"}
        </button>
      </form>

      {/* Table */}
      <h2>Visitor List</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Purpose</th>
            <th>To Meet</th>
            <th>Check-in</th>
            <th>Check-out</th>
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
              <td>{v.toMeet || "-"}</td>
              <td>{v.checkInTime ? new Date(v.checkInTime).toLocaleString() : "-"}</td>
              <td>{v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : "-"}</td>

              <td>
                <button onClick={() => handleEdit(v)}>Edit</button>
                <button onClick={() => handleDelete(v.id)}>Delete</button>

                {/* TO MEET BUTTON */}
                <button onClick={() => handleToMeet(v)}>
                  TO MEET
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
