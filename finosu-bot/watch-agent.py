import subprocess
import datetime
import pathlib
import sys

PROJECT_DIR = pathlib.Path(__file__).resolve().parent
LOG_FILE = PROJECT_DIR / "agent-watchdog.log"
LAST_DEPLOY_FILE = PROJECT_DIR / ".last-agent-deploy"

MIN_SECONDS_BETWEEN_DEPLOYS = 10 * 60

BAD_STATES = {
    "crashloop",
    "sleeping",
    "failed",
    "error",
    "stopped",
    "notready",
}


def log(message: str) -> None:
    timestamp = datetime.datetime.now().isoformat(timespec="seconds")
    line = f"[{timestamp}] {message}"
    print(line)

    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def run_command(command: list[str]) -> tuple[int, str]:
    try:
        result = subprocess.run(
            command,
            cwd=PROJECT_DIR,
            capture_output=True,
            text=False,  # important: decode manually
            shell=False,
            timeout=400
        )

        raw_output = (result.stdout or b"") + (result.stderr or b"")
        output = raw_output.decode("utf-8", errors="replace")
        return result.returncode, output.strip()

    except FileNotFoundError:
        log(f"Command not found: {command[0]}")
        sys.exit(1)


def clean_status_output(status_output: str) -> str:
    lines = []

    for line in status_output.splitlines():
        stripped = line.strip()

        if not stripped:
            continue

        if stripped.lower().startswith("warning:"):
            continue

        if "config file" in stripped.lower() and "permissions 600" in stripped.lower():
            continue

        lines.append(stripped)

    return "\n".join(lines)


def status_is_bad(status_output: str) -> bool:
    cleaned = clean_status_output(status_output)
    normalized = cleaned.lower()

    if not cleaned:
        log("Status output was empty after removing warnings.")
        return True

    for state in BAD_STATES:
        if state in normalized:
            return True

    if "running" in normalized:
        return False

    log("Could not find Running in status output.")
    return True


def deploy() -> None:
    now = datetime.datetime.now()

    if LAST_DEPLOY_FILE.exists():
        try:
            last = datetime.datetime.fromisoformat(
                LAST_DEPLOY_FILE.read_text(encoding="utf-8").strip()
            )
            elapsed = (now - last).total_seconds()

            if elapsed < MIN_SECONDS_BETWEEN_DEPLOYS:
                log(
                    f"Skipping redeploy because last deploy was "
                    f"{int(elapsed)} seconds ago."
                )
                return
        except Exception:
            pass

    log("Redeploying LiveKit agent...")

    code, deploy_output = run_command(["lk", "agent", "deploy", "."])

    log("Deploy output:")
    log(deploy_output)

    if code == 0:
        LAST_DEPLOY_FILE.write_text(now.isoformat(), encoding="utf-8")
        log("Redeploy completed successfully.")
    else:
        log(f"Redeploy failed with exit code {code}.")


def main() -> None:
    log("Checking LiveKit agent status...")

    code, status_output = run_command(["lk", "agent", "status"])

    log("Raw status output:")
    log(status_output)

    cleaned = clean_status_output(status_output)
    log("Cleaned status output:")
    log(cleaned or "[empty]")

    if code != 0:
        log("lk agent status failed.")
        deploy()
        return

    if status_is_bad(status_output):
        log("Agent appears unhealthy. Redeploying...")
        deploy()
    else:
        log("Agent appears healthy. No action needed.")


if __name__ == "__main__":
    main()