import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { login, setupTotp, confirmTotp, verifyTotp } from "../services/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState("credentials");
  const [form, setForm] = useState({ email: "", password: "" });
  const [code, setCode] = useState("");
  const [tempToken, setTempToken] = useState(null);
  const [qrUri, setQrUri] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onCredentialsSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const data = await login(form);
      setTempToken(data.tempToken);

      if (data.requiresTotpSetup) {
        const { otpauthUri } = await setupTotp(data.tempToken);
        setQrUri(otpauthUri);
        setStep("setup");
      } else if (data.requires2FA) {
        setStep("verify");
      }
    } catch (ex) {
      setErr(ex?.response?.data?.msg || ex?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSetupSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await confirmTotp(tempToken, code);
      navigate("/", { replace: true });
    } catch (ex) {
      setErr(ex?.response?.data?.msg || ex?.message || "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifySubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await verifyTotp(tempToken, code);
      navigate("/", { replace: true });
    } catch (ex) {
      setErr(ex?.response?.data?.msg || ex?.message || "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  if (step === "setup") {
    return (
      <form onSubmit={onSetupSubmit} style={{ maxWidth: 420 }}>
        <h2>Set up Two-Factor Authentication</h2>
        <p>
          Scan this QR code with your authenticator app (e.g. Google
          Authenticator or Authy), then enter the 6-digit code below.
        </p>
        {qrUri && (
          <div style={{ margin: "1rem 0" }}>
            <QRCodeSVG value={qrUri} size={200} />
          </div>
        )}
        {err && <p style={{ color: "red" }}>{err}</p>}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
          autoComplete="one-time-code"
        />
        <button type="submit" disabled={busy || code.length !== 6}>
          {busy ? "Activating…" : "Activate 2FA & Log in"}
        </button>
      </form>
    );
  }

  if (step === "verify") {
    return (
      <form onSubmit={onVerifySubmit} style={{ maxWidth: 360 }}>
        <h2>Two-Factor Authentication</h2>
        <p>Enter the 6-digit code from your authenticator app.</p>
        {err && <p style={{ color: "red" }}>{err}</p>}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
          autoComplete="one-time-code"
        />
        <button type="submit" disabled={busy || code.length !== 6}>
          {busy ? "Verifying…" : "Verify"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onCredentialsSubmit} style={{ maxWidth: 360 }}>
      <h2>Login</h2>
      {err && <p style={{ color: "red" }}>{err}</p>}
      <input
        name="email"
        type="email"
        placeholder="Email"
        autoComplete="email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        required
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <button type="submit" disabled={busy}>
        {busy ? "Logging in…" : "Log ind"}
      </button>
    </form>
  );
}
