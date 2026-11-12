"""Pre-translate the Crowdin catalogue with Gemini, rotating models as quotas run out.

Crowdin's AI pre-translate spends roughly one Gemini request per batch of strings, and the AI
Studio free tier meters requests per day. Critically, **RPD is per model, not per project**:
the Flash tier gets ~20 requests/day *each*, and the Flash Lite tier ~500 each. A single model
therefore stalls after a few hundred strings, but switching the Crowdin prompt to another model
gets a completely fresh allowance.

So this script walks MODELS in order, staying on one until it stops adding strings, then moving
to the next. Ordered best-quality-first, with the Flash Lite tier last: it is the weaker tier
but carries 25x the daily requests, so it is held back to absorb whatever Flash leaves behind.

The Flash tier is also capped at ~5 requests per *minute*, and that limit, not the daily one, is
what a busy run hits first: a pass can spend the minute's allowance and the next pass then adds
nothing even though most of the day's requests are left. So a pass that adds nothing is retried
once on the same model after waiting out the minute; only a second empty pass counts as the
daily quota being spent.

Every pass asks Crowdin to pre-translate only what is still untranslated, so runs are idempotent
— existing or human-reviewed translations are never touched. When every model is spent, the
script stops cleanly and the next scheduled run picks up where it left off.

A model Crowdin rejects — retired, renamed, or never offered by the prompt's AI provider — is
skipped with a warning rather than failing the run, so a stale id costs one step of the
rotation instead of the day's top-up.

Environment:
    CROWDIN_PROJECT_ID       (required) numeric project id
    CROWDIN_PERSONAL_TOKEN   (required) personal access token
    CROWDIN_AI_PROMPT_NAME   (optional) pre-translate prompt to use
    CROWDIN_AI_PROMPT_ID     (optional) bypass the name lookup
    CROWDIN_SOURCE_FILE      (optional) source file path within the project
    CROWDIN_LANGUAGES        (optional) comma-separated targets; defaults to all
    CROWDIN_MODELS           (optional) comma-separated model rotation order

Writes `added=<n>` to $GITHUB_OUTPUT so a workflow can skip the download when nothing changed.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE = "https://api.crowdin.com/api/v2"

PROMPT_NAME = os.environ.get("CROWDIN_AI_PROMPT_NAME", "Crag Stats pre-translate")
SOURCE_FILE = os.environ.get("CROWDIN_SOURCE_FILE", "/src/lib/i18n/locales/en.json")

# Ordered best-intelligence-first: Flash tier first (better translations, ~20 RPD each), then
# Flash Lite last (~500 RPD each). Every id must be one the prompt's AI provider offers — list
# them with GET /users/{userId}/ai/providers/{providerId}/models. Aliases such as
# gemini-flash-latest are left out: they share a quota with the model they point to.
DEFAULT_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
]

POLL_INTERVAL = 10
# The AI Studio per-minute limit is a rolling 60 s window; a little over it lets it fully clear.
RATE_WINDOW = 65
# Passes are spaced a full window apart, so each starts with the minute's allowance intact.
PASS_GAP = RATE_WINDOW
WALL_CLOCK_BUDGET = int(os.environ.get("CROWDIN_TOPUP_BUDGET", "3000"))

TOKEN = os.environ.get("CROWDIN_PERSONAL_TOKEN", "")
PROJECT = os.environ.get("CROWDIN_PROJECT_ID", "")
if not TOKEN or not PROJECT:
    print("CROWDIN_PERSONAL_TOKEN and CROWDIN_PROJECT_ID must be set", file=sys.stderr)
    sys.exit(1)


def call(method: str, path: str, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(
        BASE + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, (json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")[:400]
    except Exception as e:
        return None, repr(e)


def require(status, body, what: str):
    if status != 200:
        raise RuntimeError(f"{what} failed: HTTP {status} {body}")
    return body


def user_id() -> int:
    return require(*call("GET", "/user"), "user lookup")["data"]["id"]


def resolve_prompt(uid: int) -> tuple[int, str]:
    """Find the prompt by name, so re-creating it in Crowdin does not break CI."""
    override = os.environ.get("CROWDIN_AI_PROMPT_ID")
    body = require(*call("GET", f"/users/{uid}/ai/prompts?limit=100"), "prompt listing")
    for item in body["data"]:
        d = item["data"]
        matched = (
            str(d["id"]) == override
            if override
            else d.get("name") == PROMPT_NAME and d.get("action") == "pre_translate"
        )
        if matched:
            return d["id"], d.get("aiModelId") or "unknown"
    raise RuntimeError(
        f"no pre_translate prompt {override or PROMPT_NAME!r}; "
        "create it in Crowdin (AI > Prompts) or set CROWDIN_AI_PROMPT_ID"
    )


def is_unavailable_model(body: str) -> bool:
    """Only recognise Crowdin's explicit missing-model validation error."""
    try:
        errors = json.loads(body)["errors"]
        return bool(errors) and all(
            item["error"]["key"] == "aiModelId" and item["error"]["code"] == "notExists"
            for item in errors
        )
    except (ValueError, TypeError, KeyError):
        # Unknown or truncated responses cannot establish that the model is unavailable.
        return False


def set_model(uid: int, prompt_id: int, model: str) -> bool:
    """Point the prompt at ``model``; False when Crowdin rejects the model itself.

    Only HTTP 400 with an aiModelId/notExists error identifies an unavailable model.
    Other failures, including authentication and rate limits, still fail the run.
    """
    status, body = call(
        "PATCH",
        f"/users/{uid}/ai/prompts/{prompt_id}",
        [{"op": "replace", "path": "/aiModelId", "value": model}],
    )
    if status == 200:
        return True
    if status == 400 and is_unavailable_model(body):
        # A workflow-command annotation, so a stale id shows on the run without failing it.
        print(f"::warning::skipping {model}: Crowdin rejected it (HTTP {status} {body})")
        return False
    raise RuntimeError(f"could not switch prompt to {model}: HTTP {status} {body}")


def switch_to_usable(uid: int, prompt_id: int, rotation: list[str], start: int) -> int:
    """Switch the prompt to the first model from ``start`` on that Crowdin accepts.

    Returns its index, or ``len(rotation)`` when none is left.
    """
    for idx in range(start, len(rotation)):
        if set_model(uid, prompt_id, rotation[idx]):
            return idx
    return len(rotation)


def resolve_file_id() -> int:
    body = require(*call("GET", f"/projects/{PROJECT}/files?limit=500"), "file listing")
    for item in body["data"]:
        if item["data"].get("path") == SOURCE_FILE:
            return item["data"]["id"]
    raise RuntimeError(f"source file {SOURCE_FILE!r} not found in project {PROJECT}")


def target_languages() -> list[str]:
    if raw := os.environ.get("CROWDIN_LANGUAGES"):
        return [lang.strip() for lang in raw.split(",") if lang.strip()]
    body = require(*call("GET", f"/projects/{PROJECT}"), "project lookup")
    return list(body["data"].get("targetLanguageIds") or [])


def models() -> list[str]:
    if raw := os.environ.get("CROWDIN_MODELS"):
        return [m.strip() for m in raw.split(",") if m.strip()]
    return list(DEFAULT_MODELS)


def progress(lang: str) -> tuple[int, int]:
    body = require(
        *call("GET", f"/projects/{PROJECT}/languages/progress?limit=100"), "progress check"
    )
    for item in body["data"]:
        d = item["data"]
        if d["languageId"] == lang:
            ph = d.get("phrases", {})
            return ph.get("translated", 0), ph.get("total", 0)
    raise RuntimeError(f"language {lang} not present in project")


def run_pass(lang: str, prompt_id: int, file_id: int, deadline: float) -> str:
    status, res = call(
        "POST",
        f"/projects/{PROJECT}/pre-translations",
        {
            "languageIds": [lang],
            "fileIds": [file_id],
            "method": "ai",
            "aiPromptId": prompt_id,
            "scope": "untranslated",
            "autoApproveOption": "none",
        },
    )
    if status not in (200, 201, 202):
        raise RuntimeError(f"could not start pre-translation: HTTP {status} {res}")

    identifier = res["data"]["identifier"]
    while True:
        if time.time() > deadline:
            return "timeout"
        time.sleep(POLL_INTERVAL)
        status, body = call("GET", f"/projects/{PROJECT}/pre-translations/{identifier}")
        if status != 200:
            return f"status-unavailable({status})"
        state = body["data"].get("status")
        if state in ("finished", "failed", "canceled"):
            return state


def main() -> int:
    deadline = time.time() + WALL_CLOCK_BUDGET
    uid = user_id()
    prompt_id, current = resolve_prompt(uid)
    file_id = resolve_file_id()
    languages = target_languages()
    rotation = models()

    print(f"prompt {prompt_id} ({PROMPT_NAME}) | file {file_id} ({SOURCE_FILE})")
    print(f"languages {languages} | rotation {rotation}")

    idx = 0 if current == rotation[0] else switch_to_usable(uid, prompt_id, rotation, 0)
    if idx >= len(rotation):
        print("Crowdin rejected every model in the rotation — stopping")
        return finish(0, languages)
    print(f"starting on {rotation[idx]}")

    # Finish partly-done languages first: only fully translated strings get downloaded.
    languages.sort(key=lambda lang: -progress(lang)[0])
    total_added = 0
    retried = False  # has the current model already had its wait-and-retry?

    for lang in languages:
        done, total = progress(lang)
        if done >= total:
            print(f"{lang}: already complete ({done}/{total})")
            continue
        print(f"{lang}: starting at {done}/{total}")

        while done < total:
            if idx >= len(rotation):
                print("every model's daily quota is spent — stopping")
                return finish(total_added, languages)
            if time.time() > deadline:
                print("wall-clock budget reached — stopping")
                return finish(total_added, languages)

            state = run_pass(lang, prompt_id, file_id, deadline)
            before = done
            done, total = progress(lang)
            added = done - before
            total_added += added
            print(f"  {rotation[idx]:<24}{state:<10}{done}/{total} (+{added})")
            if state == "timeout":
                print("wall-clock budget reached during pre-translation pass — stopping")
                return finish(total_added, languages)

            if added == 0 and not retried:
                # Most likely the per-minute limit, not the day's: the model usually has
                # requests left. Wait the window out and give it one more pass.
                retried = True
                print(f"  nothing added -> waiting {RATE_WINDOW}s, then retrying {rotation[idx]}")
                time.sleep(RATE_WINDOW)
            elif added == 0:
                # Empty again after a full window, so this model's RPD is gone. Another model
                # has its own, so rotate rather than giving up on the day.
                retried = False
                idx = switch_to_usable(uid, prompt_id, rotation, idx + 1)
                if idx < len(rotation):
                    print(f"  quota spent -> switched to {rotation[idx]}")
                    time.sleep(5)
            else:
                retried = False
                time.sleep(PASS_GAP)

        if done >= total:
            print(f"{lang}: COMPLETE")

    return finish(total_added, languages)


def finish(total_added: int, languages: list[str]) -> int:
    print(f"\n+{total_added} strings this run")
    for lang in languages:
        try:
            done, total = progress(lang)
            print(f"  {lang:<8} {done}/{total}")
        except Exception as e:
            print(f"  {lang:<8} unavailable ({e})")

    if out := os.environ.get("GITHUB_OUTPUT"):
        with open(out, "a", encoding="utf-8") as fh:
            fh.write(f"added={total_added}\n")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"FAILED: {exc!r}", file=sys.stderr)
        sys.exit(1)
