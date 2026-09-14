"""Publish the latest successful main build as an AltStore Classic source."""

import json
import os
from pathlib import Path
import plistlib
import subprocess
import tempfile
import zipfile


ROOT = Path(__file__).parent
BUNDLE_ID = "blue.acorn"


def gh(repo, *args):
    return subprocess.check_output(["gh", *args, "--repo", repo], text=True)


def latest_run(repo):
    # A newer failed or running build blocks publication of older builds.
    data = subprocess.check_output([
        "gh", "api", f"repos/{repo}/actions/workflows/release.yml/runs?branch=main&per_page=1",
    ], text=True)
    runs = json.loads(data)["workflow_runs"]
    return runs[0] if runs else None


def eligible(run, event, repo):
    if not run or run["status"] != "completed" or run["conclusion"] != "success":
        return False
    if run["head_branch"] != "main" or run["head_repository"]["full_name"] != repo:
        return False
    trigger = event.get("workflow_run")
    return trigger is None or (run["id"], run["run_attempt"]) == (
        trigger["id"], trigger["run_attempt"]
    )


def make_manifest(ipa_path, run, repo, tag):
    with zipfile.ZipFile(ipa_path) as ipa:
        paths = [name for name in ipa.namelist() if name.startswith("Payload/")
                 and name.count("/") == 2 and name.endswith(".app/Info.plist")]
        if len(paths) != 1:
            raise ValueError("Expected one app Info.plist in the IPA")
        info = plistlib.loads(ipa.read(paths[0]))
        privacy = {}
        for name in ipa.namelist():
            if name.startswith("Payload/") and name.endswith((".app/Info.plist", ".appex/Info.plist")):
                privacy.update({
                    key: value for key, value in plistlib.loads(ipa.read(name)).items()
                    if key.startswith("NS") and key.endswith("UsageDescription")
                })
    if info["CFBundleIdentifier"] != BUNDLE_ID:
        raise ValueError("IPA bundle identifier is not blue.acorn")
    return {
        "name": f"Acorn ({repo.split('/')[0]})",
        "identifier": f"{BUNDLE_ID}.altstore.{repo.split('/')[0]}",
        "sourceURL": f"https://raw.githubusercontent.com/{repo}/altstore/apps.json",
        "website": f"https://github.com/{repo}",
        "apps": [{
            "name": "Acorn",
            "bundleIdentifier": BUNDLE_ID,
            "developerName": "Ali Zahid",
            "localizedDescription": "Acorn, a Reddit client for iOS. Builds from " + repo + ".",
            "iconURL": f"https://raw.githubusercontent.com/{repo}/{run['head_sha']}/apps/mobile/src/assets/images/acorn.png",
            "category": "social",
            # build-unsigned-ipa.sh disables signing and CODE_SIGN_ENTITLEMENTS.
            "appPermissions": {"entitlements": [], "privacy": privacy},
            "versions": [{
                "version": info["CFBundleShortVersionString"],
                "buildVersion": info["CFBundleVersion"],
                "date": run["updated_at"],
                "localizedDescription": f"Build from commit {run['head_sha'][:7]}.\n{run['html_url']}",
                "downloadURL": f"https://github.com/{repo}/releases/download/{tag}/{ipa_path.name}",
                "size": ipa_path.stat().st_size,
                "minOSVersion": info["MinimumOSVersion"],
            }],
        }],
        "news": [],
    }


def main():
    repo = os.environ["GITHUB_REPOSITORY"]
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    run = latest_run(repo)
    if not eligible(run, event, repo):
        print("Skipping: the latest main build has not succeeded, or this event is stale.")
        return
    # Per-attempt URLs keep an older manifest valid while a newer IPA is published.
    tag = f"altstore-{run['id']}-{run['run_attempt']}"
    with tempfile.TemporaryDirectory() as directory:
        gh(repo, "run", "download", str(run["id"]), "--name", "unsigned-ipa", "--dir", directory)
        ipa_path = Path(directory) / "Acorn-unsigned.ipa"
        data = make_manifest(ipa_path, run, repo, tag)
        if not eligible(latest_run(repo), {"workflow_run": run}, repo):
            print("Skipping: a newer build started during download.")
            return
        existing = subprocess.run(
            ["gh", "release", "view", tag, "--repo", repo], capture_output=True, text=True,
        )
        if existing.returncode:
            gh(repo, "release", "create", tag, str(ipa_path), "--target", run["head_sha"],
               "--title", f"Acorn build {run['run_number']} ({run['run_attempt']})",
               "--notes", f"Unsigned IPA from {run['html_url']}", "--prerelease", "--latest=false")
        else:
            gh(repo, "release", "upload", tag, str(ipa_path), "--clobber")

    if not eligible(latest_run(repo), {"workflow_run": run}, repo):
        print("Skipping source update: a newer build started during release publication.")
        return
    output_dir = ROOT / "altstore"
    output_dir.mkdir(exist_ok=True)
    (output_dir / "apps.json").write_text(json.dumps(data, indent=2) + "\n")
    with open(os.environ["GITHUB_OUTPUT"], "a") as output:
        output.write("publish=true\n")


if __name__ == "__main__":
    main()
