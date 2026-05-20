import { useEffect, useRef } from "react";
import { getSessionTimes, onAuthChanged } from "../services/auth";

export function useSessionTimeout({ onWarn, onExpire }) {
  const timersRef = useRef([]);
  const onWarnRef = useRef(onWarn);
  const onExpireRef = useRef(onExpire);

  onWarnRef.current = onWarn;
  onExpireRef.current = onExpire;

  useEffect(() => {
    function clearTimers() {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    }

    function schedule() {
      clearTimers();
      const { warningAt, expiresAt } = getSessionTimes();
      if (!warningAt || !expiresAt) return;

      const now = Date.now();
      const warnDelay = warningAt - now;
      const expireDelay = expiresAt - now;

      if (warnDelay > 0) {
        timersRef.current.push(setTimeout(() => onWarnRef.current(), warnDelay));
      } else if (expireDelay > 0) {
        // Passeret warningAt men ikke expiresAt — vis popup med det samme
        onWarnRef.current();
      }

      if (expireDelay > 0) {
        timersRef.current.push(setTimeout(() => onExpireRef.current(), expireDelay));
      } else {
        // Allerede udløbet
        onExpireRef.current();
      }
    }

    schedule();
    const unsubscribe = onAuthChanged(schedule);

    return () => {
      clearTimers();
      unsubscribe();
    };
  }, []);
}
