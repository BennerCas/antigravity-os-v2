import sys
import os
import pytest

# Ensure backend is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import db
from services.academy.catalog_service import CatalogService


@pytest.fixture(autouse=True)
def setup_db():
    db.init_db()
    CatalogService.seed_catalog()


def test_tracks_exist():
    tracks = CatalogService.get_tracks()
    track_ids = [t["id"] for t in tracks]
    assert "builder" in track_ids
    assert "operator" in track_ids
    assert "flow_architect" in track_ids
    assert "architect" in track_ids
    assert "expert" in track_ids
    assert len(tracks) == 5


def test_missions_count_and_completeness():
    missions = CatalogService.get_all_missions()
    assert len(missions) >= 19  # Mission 0 to 18

    mission_ids = {m.id for m in missions}
    for i in range(19):
        expected_id = f"mission_{i:02d}"
        assert expected_id in mission_ids, f"Mission {expected_id} missing from catalog"

    # Verify every mission has required fields
    for m in missions:
        assert m.title, f"Mission {m.id} has no title"
        assert m.brief, f"Mission {m.id} has no brief"
        assert m.mode in ["explore", "guided", "practice", "challenge", "project"]
        assert len(m.learning_objectives) > 0, f"Mission {m.id} has no objectives"
        assert len(m.required_evidence) > 0, f"Mission {m.id} has no required evidence"
        assert len(m.rubric) > 0, f"Mission {m.id} has no rubric criteria"


def test_skill_graph_integrity():
    skills = CatalogService.get_skills()
    assert len(skills) >= 15

    for skill_id, skill in skills.items():
        assert skill.name
        assert skill.category
        # Check prerequisites reference valid skills
        for prereq in skill.prerequisites:
            assert prereq in skills, f"Prerequisite '{prereq}' of skill '{skill_id}' does not exist"


def test_mission_01_spec():
    m1 = CatalogService.get_mission("mission_01")
    assert m1 is not None
    assert "Primer flujo funcional" in m1.title
    assert "graph_connections" in m1.skills
    assert len(m1.hints) >= 3
    assert m1.transfer_challenge is not None


def test_mission_18_capstone_spec():
    m18 = CatalogService.get_mission("mission_18")
    assert m18 is not None
    assert "Capstone Expert" in m18.title
    assert m18.difficulty == "expert"
    assert "architecture_defense" in m18.skills
