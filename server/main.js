import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";

const twoFactor = Meteor.settings?.private?.twoFactor || {};
const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "password";

if (Meteor.settings?.private?.oauthSecretKey) {
  Accounts.config({
    ambiguousErrorMessages: false,
    oauthSecretKey: Meteor.settings.private.oauthSecretKey,
  });
}

Accounts.configure2fa({
  email: {
    enabled: twoFactor.email === true,
    hashSecret: twoFactor.hashSecret,
  },
});

if (twoFactor.otp === false) {
  Accounts.validate2faChange(({ type }) => {
    if (type === "activation") {
      throw new Meteor.Error(403, "Authenticator setup is disabled in this mode.");
    }
  });
}

Meteor.methods({
  twoFactorMode() {
    return {
      otp: twoFactor.otp === true,
      email: twoFactor.email === true,
    };
  },
});

Meteor.startup(async () => {
  Accounts.emailTemplates.from = "2FA sample <no-reply@example.com>";
  const existing = await Accounts.findUserByEmail(DEMO_EMAIL);
  if (existing) {
    return;
  }
  const userId = await Accounts.createUserAsync({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  await Meteor.users.updateAsync(userId, {
    $set: { "emails.0.verified": true },
  });
});
