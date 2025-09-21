import React, { useState } from "react";
import "./AuthForm.css";

const AuthForm = ({ isRegistering, onSubmit, onToggleMode, loading }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
  });

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = e => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="auth-form">
      <h2>{isRegistering ? "Register" : "Login"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required disabled={loading} />
        </div>

        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        {isRegistering && (
          <div className="form-group">
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required disabled={loading} />
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : isRegistering ? "Register" : "Login"}
        </button>
      </form>

      <button type="button" onClick={onToggleMode} className="toggle-mode" disabled={loading}>
        {isRegistering ? "Already have an account? Login" : "Need an account? Register"}
      </button>
    </div>
  );
};

export default AuthForm;
