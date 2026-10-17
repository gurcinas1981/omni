import importlib.util
import json
import pathlib
import tempfile
import unittest
import io
from unittest.mock import patch
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location('audit', pathlib.Path(__file__).with_name('audit.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
original_get = audit.get

class CoverageTests(unittest.TestCase):
    def setUp(self):
        audit.get = original_get
        self.old_output, self.old_names = audit.OUTPUT, audit.NAMES

    def tearDown(self):
        audit.get = original_get
        audit.OUTPUT, audit.NAMES = self.old_output, self.old_names

    def test_confirmed_empty_repository(self):
        self.run_case([({}, None), (None, 'EMPTY_REPOSITORY')], 0, 'empty', None)

    def test_other_conflict_still_fails(self):
        self.run_case([({}, None), (None, 'HTTP 409')], 1, 'partial', 'HTTP 409')

    def test_http_empty_response_is_classified(self):
        error = HTTPError('https://api.github.com/test', 409, 'Conflict', {},
                          io.BytesIO(b'{"message":"Git Repository is empty."}'))
        with patch.object(audit.urllib.request, 'urlopen', side_effect=error):
            self.assertEqual(audit.get('test'), (None, 'EMPTY_REPOSITORY'))

    def test_http_other_conflict_is_not_empty(self):
        error = HTTPError('https://api.github.com/test', 409, 'Conflict', {},
                          io.BytesIO(b'{"message":"Another conflict"}'))
        with patch.object(audit.urllib.request, 'urlopen', side_effect=error):
            self.assertEqual(audit.get('test'), (None, 'HTTP 409'))

    def run_case(self, replies, expected_code, expected_status, error):
        with tempfile.TemporaryDirectory(dir=pathlib.Path(__file__).parent) as directory:
            audit.OUTPUT = pathlib.Path(directory)
            audit.NAMES = ['example']
            responses = iter(replies)
            audit.get = lambda path: next(responses)
            self.assertEqual(audit.main(), expected_code)
            report = json.loads((audit.OUTPUT / 'report.json').read_text())
            self.assertEqual(report['complete'], expected_code == 0)
            self.assertEqual(report['repositories'][0]['status'], expected_status)
            markdown = (audit.OUTPUT / 'report.md').read_text()
            if error:
                self.assertIn(error, markdown)
                self.assertIn('INCOMPLETE', markdown)
                self.assertNotIn('None detected', markdown)
                self.assertNotIn('No GitHub workflow detected', markdown)
            else:
                self.assertIn('COMPLETE', markdown)

    def test_metadata_access_denied(self):
        self.run_case([(None, 'HTTP 401')], 1, 'unverified', 'HTTP 401')

    def test_tree_access_denied(self):
        self.run_case([({'default_branch': 'main'}, None), (None, 'HTTP 403')], 1, 'partial', 'HTTP 403')

    def test_truncated_tree(self):
        self.run_case([({}, None), ({'tree': [], 'truncated': True}, None)], 1, 'partial', 'Repository tree truncated')

    def test_complete_inventory_with_missing_files(self):
        self.run_case([({}, None), ({'tree': []}, None)], 0, 'audited', None)

if __name__ == '__main__':
    unittest.main()
