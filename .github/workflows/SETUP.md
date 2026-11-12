# Workflow Setup

Setup instructions for the GitHub Actions workflows in this repository:

- [Crowdin Translation Sync & AI Pre-translate](#crowdin-translation-sync--ai-pre-translate-setup) — `crowdin-sync.yml` & `crowdin-pretranslate.yml`
- [Docker Hub & GHCR Publishing](#docker-release-setup) — `docker-release.yml`
- [Snyk Code Quota Note](#snyk-code-quota-note)

---

# Crowdin Translation Sync & AI Pre-translate Setup

`crowdin-sync.yml` uploads `src/lib/i18n/locales/en.json` to Crowdin when it changes on `main`, and opens a pull request with new translations coming back. `crowdin-pretranslate.yml` tops up untranslated strings using Google Gemini AI, rotating models to stay within free-tier quotas.

How the internationalisation architecture works is documented in [`docs/dev/TRANSLATIONS.md`](../../docs/dev/TRANSLATIONS.md).

## Prerequisites

1. A [Crowdin](https://crowdin.com/) account. Crag Stats is licensed under **AGPL-3.0** (OSI-approved open source), which qualifies for Crowdin's free **Open Source** plan with unlimited words and projects.
2. A free [Google AI Studio](https://aistudio.google.com/) API key (if using the AI pre-translate workflow).
3. Admin access to the GitHub repository settings.

## Setup Instructions

### Step 1: Create the Crowdin Project

1. Log in to [Crowdin](https://crowdin.com) and click **Create project**.
2. Name it `Crag Stats`.
3. Set the source language to **English** (`en`).
   > [!IMPORTANT]
   > Set the source language to `en` at project creation. Changing the source language later forces a full re-upload and orphans existing translations.
4. Add the initial target languages: **German** (`de`), **French** (`fr`), **Spanish** (`es`), and **Italian** (`it`). To complete parity with all languages offered by theCrag, you can also add **Korean** (`ko`), **Portuguese** (`pt`), and **Simplified Chinese** (`zh-CN`).

### Step 2: Get the Numeric Project ID

1. Open your project on Crowdin.
2. Go to **Settings** → **API**.
3. Copy the numeric **Project ID** (e.g. `123456`).

### Step 3: Create a Personal Access Token

1. Go to your Crowdin **Account Settings** (avatar in top right) → **API** → **Personal Access Tokens**.
2. Click **New token** and name it (e.g. `GitHub Actions - Crag Stats`).
3. Grant the following scopes:
   - **Projects** (read & write)
   - **Source files & translations** (read & write)
   - **AI** (read & write — required for `crowdin-pretranslate.yml` to trigger AI pre-translation passes and rotate models)
4. Click **Create** and **copy the token immediately** (it is only displayed once).

### Step 4: Configure Gemini AI & Pre-Translate Prompt (Optional, for `crowdin-pretranslate.yml`)

1. In Crowdin, go to **Account Settings** → **AI** → **Providers**.
2. Click **Add Provider** and select **Google Gemini**.
3. Paste your API key from [Google AI Studio](https://aistudio.google.com/).
4. Go to **Account Settings** → **AI** → **Prompts** and click **New Prompt**:
   - **Name**: `Crag Stats pre-translate`
   - **Action**: Select `Pre-translate`
   - **AI Provider**: Google Gemini
   - **AI Model**: Select any current Gemini model (e.g., `gemini-2.5-flash` or `gemini-3-flash-preview`); `scripts/crowdin_topup.py` will rotate this automatically.
   - **Prompt Message**:
     ```text
     You are translating climbing analytics software (Crag Stats) for rock climbers and mountaineers.
     Use authentic climbing terminology native to each language:
     - German: Rotpunkt, Flash, Onsight, Tourenbuch, Begehungen
     - French: À vue, Flash, Après travail, Moulinette, Carnet de croix
     - Spanish: A vista, Flash, Punto rojo, Libro de vías, Bloque
     - Italian: A vista, Flash, Rotpunkt, Chiusura, Falesia

     CRITICAL RULES:
     1. Climbing grade numbers and letters (e.g., 21, 6b+, 5.10a, V5, 7A) are universal identifiers and MUST NEVER be translated or converted.
     2. Preserve all ICU format tokens and placeholders (e.g., {count, plural, one {# ascent} other {# ascents}}, {count}, {name}) exactly as written.
     3. Preserve HTML/markdown formatting tokens.
     ```

### Step 5: Add GitHub Secrets

1. Navigate to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret**.
3. Add the following secrets:

   **Secret 1:**
   - Name: `CROWDIN_PROJECT_ID`
   - Value: The numeric project ID from Step 2

   **Secret 2:**
   - Name: `CROWDIN_PERSONAL_TOKEN`
   - Value: The personal access token from Step 3

### Step 6: Configure Workflow Permissions

1. In GitHub, go to **Settings** → **Actions** → **General**.
2. Scroll to **Workflow permissions**:
   - Select **Read and write permissions**.
   - Check the box **Allow GitHub Actions to create and approve pull requests**.
3. Click **Save**.

Without this permission, the GitHub action will fail when attempting to open a pull request.

### Step 7: Create GitHub Pull Request Labels

In your repository, navigate to **Issues** → **Labels** → **New label** and ensure these labels exist:

- `i18n` (Color: `#1d76db` or similar blue)
- `automated` (Color: `#e6e6e6` or similar light grey)

### Step 8: Verify the Workflows

1. Go to the **Actions** tab in GitHub.
2. Select **Crowdin Sync** → **Run workflow**.
   - Leave `dryrun` set to `true` and click **Run workflow**.
   - Inspect the logs to verify that `src/lib/i18n/locales/en.json` is detected as the upload source.
3. Re-run with `dryrun` set to `false`.
4. Check your Crowdin project: `en.json` should now appear under the project files.
5. Select **Crowdin AI Pre-translate** → **Run workflow** to test AI top-up and the automatic pull request generation.

---

# Docker Release Setup

`docker-release.yml` automatically builds multi-arch container images (`amd64` and `arm64`) and publishes them to the GitHub Container Registry (`ghcr.io/luen/crag-stats`).

Publishing triggers on:

- Pushing a version tag matching `v*.*.*` (e.g., `v0.1.0`).
- Manual dispatch via the GitHub Actions tab.
- Reusable `workflow_call` from `nightly-minor-deps-release.yml`.

Images are tagged with the semantic version number, major/minor variants, and `latest`.

---

# Snyk Code Quota Note

The repository includes a Snyk status check (`security/snyk`). On free or limited Snyk plans, Snyk may report `You have used your limit of private tests` when monthly test allowances are exhausted. This is an external SaaS quota constraint rather than a code defect.
