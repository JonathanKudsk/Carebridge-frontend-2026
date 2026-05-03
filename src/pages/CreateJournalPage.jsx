import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner, Alert } from "react-bootstrap";
import JournalForm from "../components/Journal/JournalForm";
import { getResidentById } from "../api/api";

export default function CreateJournalPage({ addJournal }) {
  const { id } = useParams();
  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResident() {
      try {
        setLoading(true);
        const data = await getResidentById(id);
        setResident(data);
      } catch (err) {
        console.error(err);
        setError("Kunne ikke hente beboer.");
      } finally {
        setLoading(false);
      }
    }
    fetchResident();
  }, [id]);

  if (loading) return <Spinner animation="border" variant="primary" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!resident) return null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Opret journalindgang for {resident.firstName} {resident.lastName}
      </h1>
      <JournalForm
        addJournal={addJournal}
        journalId={resident.journalId}
        residentId={id}
      />
    </div>
  );
}
