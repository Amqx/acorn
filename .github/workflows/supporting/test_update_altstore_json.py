import copy
from pathlib import Path
import plistlib
import tempfile
import unittest
import zipfile

from update_altstore_json import eligible, make_manifest


REPO = "amqx/acorn"
RUN = {
    "id": 123, "run_attempt": 2, "status": "completed", "conclusion": "success",
    "head_branch": "main", "head_repository": {"full_name": REPO},
    "head_sha": "abcdef123456", "updated_at": "2026-09-13T12:00:00Z",
    "html_url": "https://github.com/amqx/acorn/actions/runs/123",
}


class PublisherTests(unittest.TestCase):
    def test_success_and_manual_dispatch(self):
        self.assertTrue(eligible(RUN, {"workflow_run": RUN}, REPO))
        self.assertTrue(eligible(RUN, {}, REPO))

    def test_rejects_stale_events_and_attempts(self):
        for key, value in (("id", 122), ("run_attempt", 1)):
            with self.subTest(key=key):
                self.assertFalse(eligible(RUN, {"workflow_run": {**RUN, key: value}}, REPO))

    def test_rejects_untrusted_or_unsuccessful_runs(self):
        self.assertFalse(eligible(None, {}, REPO))
        for key, value in (
            ("status", "in_progress"), ("conclusion", "failure"),
            ("head_branch", "feature"), ("head_repository", {"full_name": "other/acorn"}),
        ):
            with self.subTest(key=key):
                run = copy.deepcopy(RUN)
                run[key] = value
                self.assertFalse(eligible(run, {}, REPO))

    def test_manifest_uses_binary_plist_and_extension_privacy(self):
        info = {
            "CFBundleIdentifier": "blue.acorn", "CFBundleShortVersionString": "1.2.3",
            "CFBundleVersion": "91", "MinimumOSVersion": "16.4",
            "NSPhotoLibraryUsageDescription": "Choose photos.",
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "Acorn-unsigned.ipa"
            with zipfile.ZipFile(path, "w") as ipa:
                ipa.writestr("Payload/Acorn.app/Info.plist", plistlib.dumps(info, fmt=plistlib.FMT_BINARY))
                ipa.writestr("Payload/Acorn.app/PlugIns/Share.appex/Info.plist", plistlib.dumps({
                    "NSCameraUsageDescription": "Take photos.",
                }))
            data = make_manifest(path, RUN, REPO, "altstore-123-2")
            app = data["apps"][0]
            version = app["versions"][0]
            self.assertEqual(version["version"], "1.2.3")
            self.assertEqual(version["buildVersion"], "91")
            self.assertEqual(version["size"], path.stat().st_size)
            self.assertEqual(version["minOSVersion"], "16.4")
            self.assertTrue(version["downloadURL"].endswith("/altstore-123-2/Acorn-unsigned.ipa"))
            self.assertEqual(len(app["appPermissions"]["privacy"]), 2)
            self.assertEqual(app["appPermissions"]["entitlements"], [])

    def test_rejects_wrong_bundle_or_missing_app(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "Acorn-unsigned.ipa"
            for contents in ({}, {"Payload/Wrong.app/Info.plist": {"CFBundleIdentifier": "wrong"}}):
                with zipfile.ZipFile(path, "w") as ipa:
                    for name, info in contents.items():
                        ipa.writestr(name, plistlib.dumps(info))
                with self.assertRaises(ValueError):
                    make_manifest(path, RUN, REPO, "altstore-123-2")


if __name__ == "__main__":
    unittest.main()
