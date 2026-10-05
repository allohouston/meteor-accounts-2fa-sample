# accounts-2fa sample

A plain Meteor app for trying the two-factor changes by hand. It does not use any application framework beyond Meteor and React.

The app runs against a checkout of [allohouston/meteor](https://github.com/allohouston/meteor) on `integration/accounts-2fa`, which contains both the TOTP hardening and the email factor. A released Meteor cannot load these changes yet.

## Run

Clone this repository next to the Meteor checkout:

```sh
git clone git@github.com:allohouston/meteor.git
cd meteor && git checkout integration/accounts-2fa
cd ..
git clone git@github.com:allohouston/meteor-accounts-2fa-sample.git
cd meteor-accounts-2fa-sample
../meteor/meteor run --settings settings.both.json
```

Open http://localhost:3000. The seeded account is `demo@example.com` / `password`. Without `MAIL_URL`, Meteor prints the email code in the server console.

## Modes

| File | Authenticator | Email code |
| --- | --- | --- |
| `settings.email-only.json` | refused | required for every password login |
| `settings.otp-only.json` | can be enrolled | off; password alone works until an authenticator is enabled |
| `settings.both.json` | can be enrolled | offered, including to a user who already has an authenticator |

`private.oauthSecretKey` is a sample AES-128 key for `oauth-encryption`. Do not reuse it.

## What to click

Email only. Sign in with the password. The server prints a 6-digit code. Enter it. A second password attempt during the cooldown does not send another email.

Authenticator only. Sign in with the password. Generate a QR code, confirm with a code from the app, sign out, then sign in again with a current code. Disabling asks for a current code. A QR code that was generated but never confirmed can be left unused; signing in still works because the authenticator is not active yet.

Both. Before enrollment, the password login emails a code. After enrollment, the login offers `otp` and `email`. Choosing email sends a code and does not consume the authenticator time step.
