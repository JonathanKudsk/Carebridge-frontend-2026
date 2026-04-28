import { useParams } from "react-router-dom";
import MedicationList from "../components/Medication/MedicationList";

export default function MedicationChartPage() {
  const { chartId } = useParams();

  return (
    <div>
      <h2 className="mb-4">Medication Chart</h2>
      <MedicationList chartId={chartId} />
    </div>
  );
}
