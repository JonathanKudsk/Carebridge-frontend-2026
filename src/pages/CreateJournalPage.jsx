import JournalForm from "../components/Journal/JournalForm";

export default function CreateJournalPage({ addJournal, residents }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Opret journalindgang</h1>
      <JournalForm addJournal={addJournal} residents={residents} />
    </div>
  );
}