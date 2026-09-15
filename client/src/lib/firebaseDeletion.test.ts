import { beforeEach, describe, expect, it, vi } from "vitest";

const firebaseMocks = vi.hoisted(() => {
  const app = { name: "test-app" };
  const functions = { app };
  const callable = vi.fn().mockResolvedValue({ data: { deleted: true } });
  return {
    app,
    functions,
    callable,
    initializeApp: vi.fn(() => app),
    initializeAppCheck: vi.fn(),
    getFunctions: vi.fn(() => functions),
    httpsCallable: vi.fn(() => callable),
  };
});

vi.mock("firebase/app", () => ({
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => firebaseMocks.app),
  initializeApp: firebaseMocks.initializeApp,
}));

vi.mock("firebase/app-check", () => ({
  initializeAppCheck: firebaseMocks.initializeAppCheck,
  ReCaptchaEnterpriseProvider: class ReCaptchaEnterpriseProvider {
    constructor(public readonly siteKey: string) {}
  },
}));

vi.mock("firebase/auth", () => ({
  browserSessionPersistence: {},
  getAuth: vi.fn(() => ({ currentUser: {} })),
  GoogleAuthProvider: class GoogleAuthProvider {},
  setPersistence: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("firebase/functions", () => ({
  getFunctions: firebaseMocks.getFunctions,
  httpsCallable: firebaseMocks.httpsCallable,
}));

import {
  DELETE_ACCOUNT_FUNCTION_NAME,
  DELETE_ACCOUNT_FUNCTION_REGION,
  invokeDeleteMyAccount,
} from "./firebase";

describe("authoritative account deletion callable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes App Check and invokes deleteMyAccount in us-central1 without account data", async () => {
    await invokeDeleteMyAccount();

    expect(DELETE_ACCOUNT_FUNCTION_NAME).toBe("deleteMyAccount");
    expect(DELETE_ACCOUNT_FUNCTION_REGION).toBe("us-central1");
    expect(firebaseMocks.initializeAppCheck).toHaveBeenCalledWith(
      firebaseMocks.app,
      expect.objectContaining({
        provider: expect.objectContaining({ siteKey: "6Lc8WbwtAAAAAI4mflvU4lxvDUYGy-1Ib2Jo27Wd" }),
        isTokenAutoRefreshEnabled: true,
      }),
    );
    expect(firebaseMocks.getFunctions).toHaveBeenCalledWith(firebaseMocks.app, "us-central1");
    expect(firebaseMocks.httpsCallable).toHaveBeenCalledWith(firebaseMocks.functions, "deleteMyAccount");
    expect(firebaseMocks.callable).toHaveBeenCalledWith();
  });
});
