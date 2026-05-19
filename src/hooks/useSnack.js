import { useContext } from "react";
import SnackContext from "../components/SnackContext.jsx";

export function useSnack() {
  const context = useContext(SnackContext);
  if (!context) {
    throw new Error("useSnack must be used within SnackProvider");
  }
  return context;
}
