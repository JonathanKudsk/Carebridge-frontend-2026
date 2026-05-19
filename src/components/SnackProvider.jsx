"use client";
import { useState, useCallback } from "react";
import SnackContext from "./SnackContext.jsx";
import { getVariantIcon } from "../utils/snackUtils.jsx";

export function SnackProvider({ children }) {
  const [snacks, setSnacks] = useState([]);
  const createSnack = useCallback((message, variant) => {
    const id = Date.now();
    const newSnack = { id, message, variant, visible: true };
    setSnacks([newSnack]);
    setTimeout(
      () =>
        setSnacks((prev) =>
          prev.map((s) => (s.id === id ? { ...s, visible: false } : s))
        ),
      2500
    );
    setTimeout(
      () => setSnacks((prev) => prev.filter((s) => s.id !== id)),
      3000
    );
  }, []);

  return (
    <SnackContext.Provider value={{ createSnack }}>
      {children}
      <div
        className="position-fixed bottom-0 start-0 p-3"
        style={{ zIndex: 1080 }}
      >
        {snacks.map((snack) => (
          <div
            key={snack.id}
            className={`toast align-items-center border-0 shadow ${
              snack.visible ? "show" : "hide"
            }`}
          >
            <div className="d-flex">
              <div className="d-flex align-items-center gap-3 px-3 py-2">
                {getVariantIcon(snack.variant)}
                <div className="text-truncate" style={{ maxWidth: 420 }}>
                  {snack.message}
                </div>
              </div>
              <button
                type="button"
                className="btn-close me-2 m-auto"
                onClick={() => setSnacks([])}
              ></button>
            </div>
          </div>
        ))}
      </div>
    </SnackContext.Provider>
  );
}

export default SnackProvider;
