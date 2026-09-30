export type SecurityFinding = {
  ruleId: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  line: number;
};

export function scanSecurity(code: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lines = code.split("\n");

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Detect hardcoded credentials
    if (
      /(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{8,}["']/i.test(
        line
      )
    ) {
      findings.push({
        ruleId: "HARDCODED_SECRET",
        severity: "critical",
        message: "Possible hardcoded secret detected.",
        line: lineNumber,
      });
    }

    // Detect eval usage
    if (/\beval\s*\(/.test(line)) {
      findings.push({
        ruleId: "UNSAFE_EVAL",
        severity: "high",
        message: "Use of eval() can execute unsafe code.",
        line: lineNumber,
      });
    }

    // Detect SQL string concatenation
    if (
      /\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(line) &&
      /\+\s*[a-zA-Z_$][\w$]*/.test(line)
    ) {
      findings.push({
        ruleId: "SQL_INJECTION_RISK",
        severity: "high",
        message: "Possible SQL injection risk from string concatenation.",
        line: lineNumber,
      });
    }
  });

  return findings;
}