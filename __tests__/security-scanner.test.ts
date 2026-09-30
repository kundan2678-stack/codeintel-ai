import { scanSecurity } from "../lib/security-scanner";

describe("CodeIntel AI Security Scanner", () => {
  test("detects hardcoded API keys", () => {
    const code = 'const api_key = "mysecretkey123456";';

    const findings = scanSecurity(code);

    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe("HARDCODED_SECRET");
    expect(findings[0].severity).toBe("critical");
  });

  test("detects unsafe eval usage", () => {
    const code = "eval(userInput);";

    const findings = scanSecurity(code);

    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe("UNSAFE_EVAL");
  });

  test("detects possible SQL injection", () => {
    const code = 'const query = "SELECT * FROM users WHERE id = " + userId;';

    const findings = scanSecurity(code);

    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe("SQL_INJECTION_RISK");
  });

  test("returns no findings for safe code", () => {
    const code = "const total = 10 + 20;";

    expect(scanSecurity(code)).toHaveLength(0);
  });

  test("handles empty code", () => {
    expect(scanSecurity("")).toHaveLength(0);
  });

  test("reports correct line number", () => {
    const code = [
      "const x = 10;",
      "const y = 20;",
      "eval(userInput);",
    ].join("\n");

    const findings = scanSecurity(code);

    expect(findings[0].line).toBe(3);
  });
});