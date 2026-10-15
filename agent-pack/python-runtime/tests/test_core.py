import json
import tempfile
import unittest
from pathlib import Path
from omnisynapse.core import ensure_db, import_json, eligible_recommendations, score_recommendation, build_brief, validate_record

ROOT=Path(__file__).resolve().parents[2]

class TestOmnisynapse(unittest.TestCase):
    def setUp(self):
        self.folder=tempfile.TemporaryDirectory()
        self.db=Path(self.folder.name)/'db.sqlite'
        self.con=ensure_db(self.db)
    def tearDown(self):
        self.con.close();self.folder.cleanup()
    def ingest(self,name):
        return import_json(self.con,ROOT/'examples'/'inbox'/name)
    def test_rejects_invalid_source_url(self):
        with self.assertRaises(ValueError):
            validate_record('evidence',dict(id='test',title='X',summary='Y',source_url='file:///etc/passwd',observed_at='2026-10-15',classification='verified_primary',project_id='FOX',confidence=0.7))
    def test_no_proposals_without_evidence(self):
        self.ingest('sample_recommendations.json')
        self.assertEqual(eligible_recommendations(self.con,True),[])
    def test_demo_does_not_leak_into_normal_brief(self):
        self.ingest('sample_evidence.json');self.ingest('sample_recommendations.json')
        self.assertFalse(eligible_recommendations(self.con,False))
        self.assertTrue(eligible_recommendations(self.con,True))
        brief=build_brief(self.con,False)
        self.assertIn('None validated',brief)
        demo=build_brief(self.con,True)
        self.assertIn('DEMONSTRATION',demo)
        self.assertIn('DEMO — Shared Site Record',demo)
    def test_dedup_by_id(self):
        self.ingest('sample_evidence.json');self.ingest('sample_evidence.json')
        self.assertEqual(self.con.execute("SELECT COUNT(*) FROM records WHERE kind='evidence'").fetchone()[0],2)
    def test_score_is_numeric(self):
        self.ingest('sample_recommendations.json')
        rec=json.loads(self.con.execute("SELECT payload FROM records WHERE kind='recommendation' LIMIT 1").fetchone()[0])
        self.assertIsInstance(score_recommendation(rec),(int,float))

if __name__=='__main__':unittest.main()
