import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";
import { useTracker } from "meteor/react-meteor-data";
import { useEffect, useState } from "react";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "password";

const errorText = error => error?.reason || error?.message || "Something went wrong.";

export const App = () => {
  const user = useTracker(() => Meteor.user());
  const [mode, setMode] = useState(null);
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [notice, setNotice] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [activation, setActivation] = useState(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    Meteor.call("twoFactorMode", (error, result) => {
      if (!error) {
        setMode(result);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setEnabled(false);
      setActivation(null);
      return;
    }
    Accounts.has2faEnabled((error, isEnabled) => {
      if (!error) {
        setEnabled(!!isEnabled);
      }
    });
  }, [user]);

  const onPassword = event => {
    event.preventDefault();
    setNotice("");
    setCode("");
    Meteor.loginWithPassword(email, password, error => {
      if (!error) {
        setChallenge(null);
        setChosen(null);
        return;
      }
      if (error.error === "no-2fa-code") {
        const methods = error.details?.methods || [];
        setChallenge({
          methods,
          emailSent: !!error.details?.emailSent,
          retryAfterMs: error.details?.retryAfterMs || 0,
        });
        setChosen(methods.length === 1 ? methods[0] : null);
        setNotice(
          error.details?.emailSent
            ? "Email code sent. Read it in the server console."
            : "Password accepted. Choose a second factor."
        );
        return;
      }
      setChallenge(null);
      setNotice(errorText(error));
    });
  };

  const requestEmail = () => {
    setChosen("email");
    setNotice("");
    Accounts.request2faEmailCode(email, password, error => {
      if (error && error.error !== "no-2fa-code") {
        setNotice(errorText(error));
        return;
      }
      const sent = !!error?.details?.emailSent;
      setChallenge(current => ({
        methods: current?.methods || ["email"],
        emailSent: sent,
        retryAfterMs: error?.details?.retryAfterMs || 0,
      }));
      setNotice(
        sent
          ? "Email code sent. Read it in the server console."
          : "The previous code is still on cooldown."
      );
    });
  };

  const onCode = event => {
    event.preventDefault();
    setNotice("");
    Meteor.loginWithPasswordAnd2faCode(email, password, code, chosen, error => {
      if (error) {
        setNotice(errorText(error));
        return;
      }
      setChallenge(null);
      setChosen(null);
      setCode("");
    });
  };

  const refreshEnabled = () => {
    Accounts.has2faEnabled((error, isEnabled) => {
      if (!error) {
        setEnabled(!!isEnabled);
      }
    });
  };

  const generateQr = () => {
    setNotice("");
    Accounts.generate2faActivationQrCode("2FA sample", (error, result) => {
      if (error) {
        setNotice(errorText(error));
        return;
      }
      setActivation(result);
    });
  };

  const enableTotp = event => {
    event.preventDefault();
    setNotice("");
    Accounts.enableUser2fa(confirmCode, error => {
      if (error) {
        setNotice(errorText(error));
        return;
      }
      setActivation(null);
      setConfirmCode("");
      setNotice("Authenticator enabled.");
      refreshEnabled();
    });
  };

  const disableTotp = event => {
    event.preventDefault();
    setNotice("");
    Accounts.disableUser2fa(disableCode, error => {
      if (error) {
        setNotice(errorText(error));
        return;
      }
      setDisableCode("");
      setNotice("Authenticator disabled.");
      refreshEnabled();
    });
  };

  return (
    <div className="page">
      <main className="main sample">
        <h1>accounts-2fa sample</h1>
        <p className="muted">
          Mode: {mode ? `OTP ${mode.otp ? "on" : "off"}, email ${mode.email ? "on" : "off"}` : "…"}
          . Account <code>{DEMO_EMAIL}</code> / <code>{DEMO_PASSWORD}</code>.
        </p>
        {notice ? <p className="notice">{notice}</p> : null}

        {user ? (
          <section>
            <p>Signed in as {user.emails?.[0]?.address}.</p>
            <p>Authenticator: {enabled ? "on" : "off"}.</p>
            <button type="button" onClick={() => Meteor.logout()}>Sign out</button>

            {mode?.otp && !enabled ? (
              <section>
                <h2>Set up an authenticator</h2>
                <button type="button" onClick={generateQr}>Generate QR code</button>
                {activation ? (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: activation.svg }} />
                    <p>Secret: <code>{activation.secret}</code></p>
                    <form onSubmit={enableTotp}>
                      <label>
                        Code from the app
                        <input value={confirmCode} onChange={event => setConfirmCode(event.target.value)} />
                      </label>
                      <button type="submit">Enable</button>
                    </form>
                  </>
                ) : null}
              </section>
            ) : null}

            {enabled ? (
              <form onSubmit={disableTotp}>
                <h2>Disable the authenticator</h2>
                <label>
                  Current code
                  <input value={disableCode} onChange={event => setDisableCode(event.target.value)} />
                </label>
                <button type="submit">Disable</button>
              </form>
            ) : null}
          </section>
        ) : (
          <section>
            <form onSubmit={onPassword}>
              <label>
                Email
                <input value={email} onChange={event => setEmail(event.target.value)} />
              </label>
              <label>
                Password
                <input type="password" value={password} onChange={event => setPassword(event.target.value)} />
              </label>
              <button type="submit">Continue</button>
            </form>

            {challenge ? (
              <form onSubmit={onCode}>
                <h2>Second factor</h2>
                <p>Available: {challenge.methods.join(", ") || "none"}.</p>
                {challenge.methods.includes("otp") ? (
                  <button type="button" onClick={() => setChosen("otp")}>Use authenticator</button>
                ) : null}
                {challenge.methods.includes("email") ? (
                  <button type="button" onClick={requestEmail}>Email me a code</button>
                ) : null}
                {chosen ? (
                  <label>
                    Code ({chosen})
                    <input value={code} onChange={event => setCode(event.target.value)} />
                  </label>
                ) : null}
                <button type="submit" disabled={!chosen || !code}>Sign in</button>
              </form>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
};
