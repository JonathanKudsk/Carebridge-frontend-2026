import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

export default function Substitute() {
  const [substitutes, setSubstitutes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

  //TODO: Remove test departments when backend is ready with data
  const testDepartments = [
    {
      id: "test-department-a",
      name: "Test Department A",
      address: "Showdown vej 21",
      city: "Falskeby",
      zip_code: "1234",
    },
    {
      id: "test-department-b",
      name: "Test Department B",
      address: "Morgenvej 7",
      city: "Solkysten",
      zip_code: "5678",
    },
    {
      id: "test-department-c",
      name: "Test Department C",
      address: "Hovedgade 14",
      city: "Nordby",
      zip_code: "9012",
    },
  ];

  //TODO: Remove test substitutes and departments when backend is ready with data
  const testSubstitutes = [
    {
      id: "test-substitute-1",
      name: "Kevin",
      email: "kevin@test.com",
      role: "Vikar",
      departments: [testDepartments[0], testDepartments[1]],
      cities: {
        name: testDepartments[0].city,
        zip_code: testDepartments[0].zip_code,
      },
    },
    {
      id: "test-substitute-2",
      name: "Maja",
      email: "maja@test.com",
      role: "Vikar",
      departments: testDepartments[0],
      cities: {
        name: testDepartments[0].city,
        zip_code: testDepartments[0].zip_code,
      },
    },
  ];

  //TODO: Might move to a css file
  const pageStyles = {
    page: {
      padding: "24px",
    },
    title: {
      marginBottom: "8px",
    },
    intro: {
      marginBottom: "24px",
      color: "#555",
    },
    selectRow: {
      marginBottom: "24px",
      color: "#555",
    },
    select: {
      minWidth: "240px",
      padding: "10px 12px",
      borderRadius: "10px",
      border: "1px solid #cfd6e4",
      background: "#fff",
      color: "#334155",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "16px",
      alignItems: "stretch",
    },
    card: {
      border: "1px solid #d8deea",
      borderRadius: "16px",
      padding: "18px",
      background: "#fff",
      boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
      minHeight: "220px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    topRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      marginBottom: "14px",
      flexWrap: "wrap",
    },
    name: {
      margin: 0,
      fontSize: "1.25rem",
      fontWeight: 700,
      color: "#0f172a",
    },
    meta: {
      margin: 0,
      color: "#334155",
      fontSize: "0.95rem",
    },
    details: {
      borderTop: "1px solid #eef2f7",
      paddingTop: "14px",
      display: "grid",
      gap: "8px",
      color: "#334155",
    },
    label: {
      fontWeight: 600,
      color: "#0f172a",
    },
    emptyState: {
      padding: "16px",
      borderRadius: "12px",
      background: "#f8fafc",
      border: "1px dashed #cbd5e1",
      color: "#475569",
      marginTop: "16px",
    },
  };

  const fetchSubstitutes = useCallback(() => {
    api
      .get("/substitutes")
      .then((response) => response.data)
      .then((data) => setSubstitutes(data))
      .catch((error) => {
        console.error("Error fetching substitutes:", error);
        alert("Der skete en fejl ved indlæsning af vikarer. Prøv igen senere.");
      });
  }, []);

  useEffect(() => {
    fetchSubstitutes();
  }, [fetchSubstitutes]);

  const fetchDepartments = useCallback(() => {
    api
      .get("/departments")
      .then((response) => response.data)
      .then((data) => setDepartments(data))
      .catch((error) => {
        console.error("Error fetching departments:", error);
        alert("Der skete en fejl ved indlæsning af afdelinger. Prøv igen senere.");
      });
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  function handleChange(event) {
    setSelectedDepartmentId(event.target.value);
  }

  function getSubstituteDepartments(substitute) {
    if (Array.isArray(substitute.departments)) {
      return substitute.departments;
    }

    return substitute.departments ? [substitute.departments] : [];
  }

  const allSubstitutes = [...substitutes, ...testSubstitutes];

  const visibleSubstitutes = selectedDepartmentId
    ? allSubstitutes.filter((substitute) => {
        return getSubstituteDepartments(substitute).some((department) => {
          return String(department.id) === selectedDepartmentId;
        });
      })
    : allSubstitutes;

  return (
    <div style={pageStyles.page}>
      <h1 style={pageStyles.title}>Vikar</h1>
      <p style={pageStyles.intro}>Velkommen til Vikar-siden!</p>

      <div style={pageStyles.selectRow}>
        <select
          name="departments"
          onChange={handleChange}
          value={selectedDepartmentId}
          style={pageStyles.select}
        >
          <option value="">Vælg en afdeling</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
          {testDepartments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </div>

      <div style={pageStyles.grid}>
        {visibleSubstitutes.map((substitute) => (
          <div key={substitute.id} style={pageStyles.card}>
            <div style={pageStyles.topRow}>
              <h2 style={pageStyles.name}>{substitute.name}</h2>
              <p style={pageStyles.meta}>{substitute.role}</p>
            </div>

            <div style={pageStyles.details}>
              <p style={pageStyles.meta}>
                <span style={pageStyles.label}>Email:</span> {substitute.email}
              </p>
              <div>
                <p style={pageStyles.meta}>
                  <span style={pageStyles.label}>Departments:</span>
                </p>
                <div style={{ display: "grid", gap: "8px", marginTop: "6px" }}>
                  {getSubstituteDepartments(substitute).length > 0 ? (
                    getSubstituteDepartments(substitute).map((department) => (
                      <div
                        key={department.id}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "12px",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <p style={pageStyles.meta}>
                          <span style={pageStyles.label}>Name:</span>{" "}
                          {department.name ?? "N/A"}
                        </p>
                        <p style={pageStyles.meta}>
                          <span style={pageStyles.label}>Address:</span>{" "}
                          {department.address ?? "N/A"}
                        </p>
                        <p style={pageStyles.meta}>
                          <span style={pageStyles.label}>City:</span>{" "}
                          {department.city ?? "N/A"}{" "}
                          {department.zip_code ?? ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={pageStyles.meta}>N/A</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

      </div>

      {selectedDepartmentId &&
        visibleSubstitutes.length === 0 &&
        selectedDepartmentId !== testDepartments[0].id && (
        <p style={pageStyles.emptyState}>
          No substitutes match the selected department.
        </p>
      )}
    </div>
  );
}
