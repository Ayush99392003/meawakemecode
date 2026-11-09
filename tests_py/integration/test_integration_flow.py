import pytest
from datetime import datetime
from backend_py.curriculum_engine import CurriculumEngine
from backend_py.streak_engine import StreakEngine
from backend_py.codeforces_engine import CodeforcesEngine
from backend_py.mcq_engine import MCQEngine
from backend_py.models import DayQuestion, MCQOption

def test_full_day_completion_and_streak_integration():
    day_problem_ids = ["lc_1", "lc_217", "lc_49", "cf_1850A", "cf_158B"]
    user_solved_problems = set()
    user_completed_days = set()

    # Step 1: User starts Day 1
    status = CurriculumEngine.evaluate_day_status(
        day_number=1,
        completed_day_numbers=user_completed_days,
        problems_solved_for_day=len(user_solved_problems),
        strict_mode=True
    )
    assert status == "unlocked"

    # Step 2: User manually solves 3 LeetCode problems
    now_iso = "2026-11-05T14:00:00Z"
    user_solved_problems.update(["lc_1", "lc_217", "lc_49"])
    status = CurriculumEngine.evaluate_day_status(
        day_number=1,
        completed_day_numbers=user_completed_days,
        problems_solved_for_day=len(user_solved_problems),
        strict_mode=True
    )
    assert status == "in_progress"

    # Step 3: User triggers Codeforces sync
    cf_engine = CodeforcesEngine(min_interval_seconds=2.0)
    allowed, _ = cf_engine.check_rate_limit("tourist")
    assert allowed is True

    mock_cf_submissions = [
        {"contestId": 1850, "index": "A", "verdict": "OK"},
        {"contestId": 158, "index": "B", "verdict": "OK"},
    ]
    # Codeforces API response format wraps problem details
    formatted_submissions = [
        {"verdict": s["verdict"], "problem": {"contestId": s["contestId"], "index": s["index"]}}
        for s in mock_cf_submissions
    ]
    accepted_ids = cf_engine.extract_accepted_problems(formatted_submissions)
    assert "1850A" in accepted_ids
    assert "158B" in accepted_ids

    # Add matching CF problems to user solves
    user_solved_problems.add("cf_1850A")
    user_solved_problems.add("cf_158B")

    # Step 4: Verify Day 1 auto-completes (5/5)
    assert len(user_solved_problems) == 5
    if len(user_solved_problems) >= 5:
        user_completed_days.add(1)

    status_day1 = CurriculumEngine.evaluate_day_status(1, user_completed_days, 5, strict_mode=True)
    assert status_day1 == "completed"

    # Strict mode now automatically unlocks Day 2
    status_day2 = CurriculumEngine.evaluate_day_status(2, user_completed_days, 0, strict_mode=True)
    assert status_day2 == "unlocked"

    # Step 5: Streaks are accurately computed
    ref_dt = datetime.fromisoformat(now_iso)
    streaks = StreakEngine.calculate_streaks([now_iso], timezone_name="UTC", reference_dt=ref_dt)
    assert streaks["current_streak"] == 1
    assert streaks["total_days_active"] == 1

def test_codeforces_rate_limiter_blocks_immediate_retry():
    cf_engine = CodeforcesEngine(min_interval_seconds=2.0)
    allowed1, wait1 = cf_engine.check_rate_limit("speed_demon")
    assert allowed1 is True
    assert wait1 == 0.0

    allowed2, wait2 = cf_engine.check_rate_limit("speed_demon")
    assert allowed2 is False
    assert wait2 > 0.0

