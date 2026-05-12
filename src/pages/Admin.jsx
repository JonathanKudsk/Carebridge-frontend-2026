import { useState } from "react";
import { Card, Form, Button } from "react-bootstrap";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  // Fetch user by email
  const handleSearch = async () => {
    try {
      setError(null);
      setMessage("");

      const res = await fetch(
        `http://localhost:7070/api/users/by-email/${email}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("User not found");
      }

      const data = await res.json();
      setUser(data);
    } catch (err) {
      setUser(null);
      setError(err.message);
    }
  };

  // Change user role
  const handleChangeRole = async () => {
    try {
      setError(null);
      setMessage("");

      if (!role) {
        throw new Error("Please select a role");
      }

      if (confirmEmail !== user.email) {
        throw new Error("Email confirmation does not match");
      }

      const res = await fetch(
        `http://localhost:7070/api/auth/role/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: role,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.msg || "Failed to change role");
      }

      setMessage("Role updated successfully");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="d-flex justify-content-center mt-5">
      <Card style={{ width: "500px" }} className="p-4 shadow-sm rounded-4">
        <h3 className="mb-4 text-center">Admin Panel</h3>

        <Form onSubmit={(e) => e.preventDefault()}>
          {/* Email search */}
          <Form.Group className="mb-3">
            <Form.Label>User Email</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter user email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>

          <Button
            variant="info"
            className="w-100 mb-3"
            onClick={handleSearch}
          >
            Find User
          </Button>

          {/* User info */}
          {user && (
            <>
              <Card className="mb-3 p-3 bg-dark text-white rounded-3">
                <strong>{user.name}</strong>
                <div className="text-light">{user.email}</div>
                <div className="small">Current role: {user.role}</div>
              </Card>

              {/* Role selection */}
              <Form.Group className="mb-3">
                <Form.Label>Select New Role</Form.Label>
                <Form.Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="">Choose role...</option>
                  <option value="CAREWORKER">Careworker</option>
                  <option value="USER">User</option>
                  <option value="GUARDIAN">Guardian</option>
                </Form.Select>
              </Form.Group>

              {/* Confirm email */}
              <Form.Group className="mb-3">
                <Form.Label>Confirm Email</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Type email to confirm"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                />
              </Form.Group>

              <Button
                variant="success"
                className="w-100"
                disabled={!user || !role || confirmEmail !== user.email}
                onClick={handleChangeRole}
              >
                Change Role
              </Button>
            </>
          )}

          {/* Messages */}
          {error && <p className="text-danger mt-3">{error}</p>}
          {message && <p className="text-success mt-3">{message}</p>}
        </Form>
      </Card>
    </div>
  );
}