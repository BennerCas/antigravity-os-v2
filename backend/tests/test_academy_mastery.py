import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import uuid

import db
from services.academy.mastery_engine import MasteryEngine


@pytest.fixture(autouse=True)
def setup_db():
    db.init_db()


def test_mastery_initial_state():
    uid = f"learner_init_{uuid.uuid4().hex[:6]}"
    res = db.skill_mastery_get(uid, "graph_connections")
    assert res["state"] == "UNKNOWN"
    assert res["mastery_score"] == 0.0


def test_mastery_autonomous_pass():
    uid = f"learner_auto_{uuid.uuid4().hex[:6]}"
    # Pass without any hints used
    record = MasteryEngine.update_skill_mastery(
        user_id=uid,
        skill_id="graph_connections",
        passed_cleanly=True,
        hints_used=[],
        has_transfer=False,
        has_reflection=True,
    )
    assert record.mastery_score > 0.60
    assert record.dimensions.independence == 1.0
    assert record.dimensions.correctness >= 0.60
    assert record.state in ["COMPETENT", "INDEPENDENT", "MASTERED"]


def test_false_mastery_hint_penalty():
    # Pass with level 4 hint (severe penalty)
    record_hinted = MasteryEngine.update_skill_mastery(
        user_id="learner_test_hint_abuser",
        skill_id="conditions",
        passed_cleanly=True,
        hints_used=[1, 2, 3, 4],  # Used level 4 solution clue
        has_transfer=False,
        has_reflection=False,
    )
    # Pass without hints
    record_autonomous = MasteryEngine.update_skill_mastery(
        user_id="learner_test_autonomous",
        skill_id="conditions",
        passed_cleanly=True,
        hints_used=[],
        has_transfer=False,
        has_reflection=True,
    )
    # The autonomous learner must have higher independence and score
    assert (
        record_autonomous.dimensions.independence
        > record_hinted.dimensions.independence
    )
    assert record_autonomous.mastery_score > record_hinted.mastery_score


def test_mastery_expert_promotion():
    record_expert = MasteryEngine.update_skill_mastery(
        user_id="learner_test_expert",
        skill_id="multi_agent_teams",
        passed_cleanly=True,
        hints_used=[],
        has_transfer=True,
        has_reflection=True,
        complexity_score=1.0,
    )
    assert record_expert.mastery_score >= 0.80
    assert record_expert.dimensions.transfer >= 0.5
