import { useState, useEffect } from "react";
import { Card, Form, Button, Table, Spinner, Pagination, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../services/api"; // Tilpas stien hvis jeres api.js ligger i src/api/api.js

export default function JournalOverviewPage() {
  const navigate = useNavigate();

  // State til søgning og paginering
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState(""); // Holder styr på input-feltet før der trykkes "Søg"
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Krav fra ticket: maks 10-20 resultater pr. side

  // State til data og UI
  const [results, setResults] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Hjælpefunktion til at læse Javas dato-array
  const formatJavaDate = (dateArray) => {
    if (!Array.isArray(dateArray) || dateArray.length < 3) return "Ukendt dato";
    const [year, month, day, hour, minute] = dateArray;
    // Giver formatet: DD/MM/YYYY HH:mm
    return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year} ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  // Funktion der kalder vores nye backend endpoint
  const fetchJournals = async (query, page) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      // Kalder API'et med de rigtige query-parametre
      const response = await api.get(`/journals/search`, {
        params: {
          query: query,
          page: page,
          pageSize: pageSize
        }
      });

      console.log("HELE BACKEND SVARET:", response.data);

      setResults(response.data.items || []);
      setTotalPages(Math.ceil(response.data.total / pageSize) || 1);
    } catch (error) {
      console.error("Fejl ved søgning efter journaler:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Håndter når brugeren trykker "Søg"
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(inputValue);
    setCurrentPage(1); // Krav: Paginering nulstiller ved ny søgning
    fetchJournals(inputValue, 1);
  };

  // Håndter sideskift
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchJournals(searchQuery, newPage);
    }
  };

  // Hent data automatisk første gang siden indlæses (valgfrit, men god UX)
  useEffect(() => {
    fetchJournals("", 1);
  }, []);

  return (
    <Card className="p-4 shadow-sm mx-auto" style={{ maxWidth: "1000px" }}>
      <Card.Body>
        <Card.Title className="mb-4">Søg i Journaler</Card.Title>

        {/* Søgefelt */}
        <Form onSubmit={handleSearch} className="mb-4">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Søg på titel, indhold..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <Button variant="primary" type="submit" disabled={isLoading}>
              Søg
            </Button>
          </InputGroup>
        </Form>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Søger i journaler...</p>
          </div>
        )}

        {/* Tom-tilstand (når søgningen er færdig, men der er 0 resultater) */}
        {!isLoading && hasSearched && results.length === 0 && (
          <div className="text-center my-5 text-muted">
            <h5>Ingen journaler fundet</h5>
            <p>Prøv at justere din søgning eller brug færre ord.</p>
          </div>
        )}

        {/* Resultat Tabel */}
        {!isLoading && results.length > 0 && (
          <>
            <Table hover responsive className="mt-3 align-middle cursor-pointer">
              <thead className="table-light">
                <tr>
                  <th>Titel</th>
                  <th>Dato</th>
                  <th>Medarbejder</th>
                  <th>Risikoniveau</th>
                </tr>
              </thead>
              <tbody>
                {results.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => navigate(`/journal/${entry.journalId || entry.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="fw-bold">{entry.title}</td>

                    {/* Bruger vores nye dato-funktion */}
                    <td>{formatJavaDate(entry.createdAt)}</td>

                    {/* Viser brugerens navn hvis det findes, ellers deres ID */}
                    <td>{entry.authorName ? entry.authorName : `Bruger ID: ${entry.authorUserId}`}</td>

                    <td>
                      <span className={`badge ${entry.riskAssessment === 'HIGH' ? 'bg-danger'
                        : entry.riskAssessment === 'MEDIUM' ? 'bg-warning text-dark'
                          : 'bg-success'
                        }`}>
                        {entry.riskAssessment || "LOW"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Paginering / Forrige - Næste knapper */}
            <div className="d-flex justify-content-between align-items-center mt-4">
              <Button
                variant="outline-secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &larr; Forrige
              </Button>
              <span className="text-muted">
                Side {currentPage} af {totalPages}
              </span>
              <Button
                variant="outline-secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Næste &rarr;
              </Button>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}