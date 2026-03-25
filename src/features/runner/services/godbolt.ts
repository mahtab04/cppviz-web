/**
 * C++ code runner using the Compiler Explorer (Godbolt) public API.
 *
 * Sends the user's C++ code to godbolt.org for compilation + execution,
 * returning stdout/stderr. No local compiler needed.
 *
 * API docs: https://github.com/compiler-explorer/compiler-explorer/blob/main/docs/API.md
 */

export interface GodboltCompiler {
  id: string;
  name: string;
  /** Short label for the dropdown */
  label: string;
}

/** Curated list of popular, well-supported compilers on Godbolt. */
export const COMPILERS: GodboltCompiler[] = [
  { id: "g141",     name: "GCC 14.1",        label: "GCC 14.1" },
  { id: "g132",     name: "GCC 13.2",        label: "GCC 13.2" },
  { id: "clang1810", name: "Clang 18.1.0",   label: "Clang 18.1" },
  { id: "clang1701", name: "Clang 17.0.1",   label: "Clang 17.0" },
  { id: "vcpp_v19_latest_x64", name: "MSVC v19 latest (x64)", label: "MSVC 19 x64" },
  { id: "vcpp_v19_38_x64", name: "MSVC 2022 17.8 (x64)", label: "MSVC 2022" },
];

export const DEFAULT_COMPILER = COMPILERS[0].id;

export interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  compilationOutput: string;
  /** True if compilation failed before execution */
  didNotRun: boolean;
}

const GODBOLT_API = "https://godbolt.org/api/compiler";

/** Strip ANSI escape codes (colour, bold, reset, etc.) that GCC/Clang emit. */
function stripAnsi(s: string): string {
  // Matches CSI sequences (ESC[…m, ESC[…K, etc.) and lone ESC
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*[A-Za-z]|\x1b\[?[0-9;]*[A-Za-z]/g, "");
}

function asCleanText(lines: Array<{ text: string }> | undefined): string {
  if (!lines?.length) return "";
  return stripAnsi(
    lines
      .map((l) => (l?.text ?? "").replace(/\r\n?/g, "\n"))
      .join("\n")
  )
    .replace(/\b[a-zA-Z0-9_.-]+\.(?:c|cc|cpp|cxx|ixx)\b/g, "<source>")
    .trim();
}

function dedupeLines(text: string): string {
  if (!text) return "";

  const out: string[] = [];
  let previousNonEmpty = "";

  for (const line of text.split("\n")) {
    const key = line.trim();
    if (!key) {
      out.push("");
      previousNonEmpty = "";
      continue;
    }
    if (key === previousNonEmpty) continue;
    previousNonEmpty = key;
    out.push(line);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function filterNoisyWarnings(text: string, isMSVC: boolean): string {
  if (!text) return "";
  if (!isMSVC) return text;

  return text
    .split("\n")
    .filter((line) => !/\bD9002\b/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function runCppCode(
  code: string,
  compilerId: string = DEFAULT_COMPILER,
  stdin: string = ""
): Promise<RunResult> {
  // MSVC uses /std:c++20 /Od; GCC/Clang use -std=c++20 -O0
  const isMSVC = compilerId.startsWith("vcpp");
  const userArguments = isMSVC ? "/std:c++20 /Od" : "-std=c++20 -O0";

  const payload = {
    source: code,
    compiler: compilerId,
    options: {
      userArguments,
      executeParameters: {
        args: [],
        stdin,
      },
      compilerOptions: {
        executorRequest: true,
      },
      filters: {
        execute: true,
      },
    },
    lang: "c++",
    allowStoreCodeDebug: true,
  };

  const resp = await fetch(`${GODBOLT_API}/${compilerId}/compile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Godbolt API error (${resp.status}): ${text}`);
  }

  const data = await resp.json();

  // Godbolt executor response format:
  //   Top-level: { code, stdout, stderr, didExecute, buildResult: { code, stderr, stdout } }
  //   - buildResult.stderr = compiler diagnostics (errors/warnings)
  //   - data.stdout / data.stderr = execution output (only if didExecute is true)
  //   - data.didExecute = whether compilation succeeded and the program ran
  const buildResult = data.buildResult ?? {};

  // Compilation output (warnings/errors from the compiler)
  // MSVC may emit diagnostics on stdout, so include both streams.
  const buildStdout = asCleanText(buildResult.stdout);
  const buildStderr = asCleanText(buildResult.stderr);
  const compilationOutput = filterNoisyWarnings(
    dedupeLines([buildStderr, buildStdout].filter(Boolean).join("\n")),
    isMSVC
  );

  if (!data.didExecute) {
    // Compilation failed — no execution happened
    return {
      exitCode: buildResult.code ?? data.code ?? 1,
      stdout: "",
      stderr: compilationOutput,
      compilationOutput,
      didNotRun: true,
    };
  }

  // Execution succeeded — read runtime output from top-level fields
  const stdout = asCleanText(data.stdout);
  const stderr = asCleanText(data.stderr);

  return {
    exitCode: data.code ?? 0,
    stdout,
    stderr,
    compilationOutput,
    didNotRun: false,
  };
}
