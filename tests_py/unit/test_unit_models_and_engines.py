import pytest
from backend_py.models import DayQuestion, MCQOption
from backend_py.curriculum_engine import CurriculumEngine
from backend_py.mcq_engine import MCQEngine
from backend_py.codeforces_engine import CodeforcesEngine
from backend_py.merge_engine import MergeEngine

def test_mcq_public_dict_hides_solution():
    options = [
        MCQOption(key="A", text="O(1)"),
        MCQOption(key="B", text="O(N)"),
        MCQOption(key="C", text="O(N^2)"),
        MCQOption(key="D", text="O(log N)")
    ]
    q = DayQuestion(
        id="mcq_1",
        day_id="day_1",
        topic="Complexity",
        question="What is the worst case?",
        options=options,
        correct_option="C",
        detailed_explanation="Under heavy collisions, lookup degrades to O(N)."
    )

    public_view = q.to_public_dict()
    assert "correct_option" not in public_view
    assert "detailed_explanation" not in public_view
    assert len(public_view["options"]) == 4

def test_mcq_evaluation_correct_and_wrong():
    options = [
        MCQOption(key="A", text="Option A"),
        MCQOption(key="B", text="Option B"),
        MCQOption(key="C", text="Option C"),
        MCQOption(key="D", text="Option D"),
    ]
    q = DayQuestion(
        id="mcq_2",
        day_id="day_1",
        topic="Binary Search",
        question="What is the time complexity of binary search on sorted array?",
        options=options,
        correct_option="B",
        detailed_explanation="Halves search space every step: O(log N)."
    )

    correct_res = MCQEngine.evaluate_submission(q, "B")
    assert correct_res["is_correct"] is True
    assert correct_res["correct_option"] == "B"
    assert "Halves search space" in correct_res["detailed_explanation"]

    wrong_res = MCQEngine.evaluate_submission(q, "A")
    assert wrong_res["is_correct"] is False
    assert wrong_res["correct_option"] == "B"

def test_curriculum_strict_mode():
    completed = {1}
    assert CurriculumEngine.evaluate_day_status(1, completed, 5, strict_mode=True) == "completed"
    assert CurriculumEngine.evaluate_day_status(2, completed, 0, strict_mode=True) == "unlocked"
    assert CurriculumEngine.evaluate_day_status(3, completed, 0, strict_mode=True) == "locked"

def test_codeforces_regex_validation():
    assert CurriculumEngine.validate_cf_external_id("1850A") is True
    assert CurriculumEngine.validate_cf_external_id("71A") is True
    assert CurriculumEngine.validate_cf_external_id("158B") is True
    assert CurriculumEngine.validate_cf_external_id("1850A1") is True # Sub-problem indices
    assert CurriculumEngine.validate_cf_external_id("invalid") is False
    assert CurriculumEngine.validate_cf_external_id("1850") is False

def test_merge_engine_later_timestamp_wins():
    cloud = {
        "lc_1": {"problem_id": "lc_1", "status": "started", "updated_at": "2026-11-05T10:00:00Z"},
        "lc_2": {"problem_id": "lc_2", "status": "solved", "updated_at": "2026-11-05T12:00:00Z"}
    }
    guest = [
        {"problem_id": "lc_1", "status": "solved", "updated_at": "2026-11-05T11:00:00Z"}, # Newer -> overwrite
        {"problem_id": "lc_2", "status": "started", "updated_at": "2026-11-05T09:00:00Z"}, # Older -> ignored
        {"problem_id": "lc_3", "status": "solved", "updated_at": "2026-11-05T11:30:00Z"}  # New -> added
    ]

    merged = MergeEngine.merge_problem_progress(cloud, guest)
    assert merged["lc_1"]["status"] == "solved"
    assert merged["lc_2"]["status"] == "solved"
    assert merged["lc_3"]["status"] == "solved"

