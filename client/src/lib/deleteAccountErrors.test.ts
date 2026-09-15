import { describe, expect, it } from "vitest";
import { deletionErrorMessage } from "./deleteAccountErrors";

describe("deletionErrorMessage", () => {
  it("maps callable authentication, authorization, and availability errors to clear guidance", () => {
    expect(deletionErrorMessage({ code: "functions/unauthenticated" })).toContain("sign in with Google again");
    expect(deletionErrorMessage({ code: "functions/permission-denied" })).toContain("not authorized");
    expect(deletionErrorMessage({ code: "functions/failed-precondition" })).toContain("not ready");
    expect(deletionErrorMessage({ code: "functions/unavailable" })).toContain("temporarily unavailable");
  });

  it("hides unknown Firebase implementation details", () => {
    expect(deletionErrorMessage(new TypeError("Failed to fetch"))).toBe("Account deletion could not be completed. Please try again later.");
    expect(deletionErrorMessage({ code: "functions/unknown", message: "implementation detail" })).toBe("Account deletion could not be completed. Please try again later.");
  });
});
