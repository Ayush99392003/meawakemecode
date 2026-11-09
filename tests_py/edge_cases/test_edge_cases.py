import pytest
from datetime import datetime
from backend_py.streak_engine import StreakEngine
from backend_py.merge_engine import MergeEngine
from backend_py.curriculum_engine import CurriculumEngine
from backend_py.models import DayQuestion, MCQOption

def test_streak_across_leap_year():
    # 2028 is a leap year: Feb 28 -> Feb 29 -> March 1
    timestamps = [
        "2028-02-28T10:00:00Z",
        "2028-02-29T11:00:00Z",
        "2028-03-01T09:00:00Z"
    ]
    ref_dt = datetime.fromisoformat("2028-03-01T12:00:00Z")
    streaks = StreakEngine.calculate_streaks(timestamps, timezone_name="UTC", reference_dt=ref_dt)

    assert streaks["current_streak"] == 3
    assert streaks["longest_streak"] == 3
    assert streaks["total_days_active"] == 3

def test_streak_across_year_boundary():
    # Dec 31 -> Jan 1 transition
    timestamps = [
        "2025-12-31T23:30:00Z",
        "2026-01-01T00:15:00Z"
    ]
    ref_dt = datetime.fromisoformat("2026-01-01T12:00:00Z")
    streaks = StreakEngine.calculate_streaks(timestamps, timezone_name="UTC", reference_dt=ref_dt)

    assert streaks["current_streak"] == 2
    assert streaks["longest_streak"] == 2

def test_midnight_crossing_counts_as_two_days():
    # 23:59:59 PM and 00:00:05 AM in Asia/Kolkata
    timestamps = [
        "2026-11-04T18:29:59Z", # 23:59:59 in IST (Nov 4)
        "2026-11-04T18:30:05Z"  # 00:00:05 in IST (Nov 5)
    ]
    ref_dt = datetime.fromisoformat("2026-11-04T19:00:00Z") # Nov 5 morning in IST
    streaks = StreakEngine.calculate_streaks(timestamps, timezone_name="Asia/Kolkata", reference_dt=ref_dt)

    assert streaks["current_streak"] == 2
    assert streaks["total_days_active"] == 2

def test_same_day_multiple_solves_does_not_inflate_streak():
    # 5 solves all on the same date
    timestamps = [
        "2026-11-05T08:00:00Z",
        "2026-11-05T09:00:00Z",
        "2026-11-05T12:00:00Z",
        "2026-11-05T15:00:00Z",
        "2026-11-05T20:00:00Z",
    ]
    ref_dt = datetime.fromisoformat("2026-11-05T22:00:00Z")
    streaks = StreakEngine.calculate_streaks(timestamps, timezone_name="UTC", reference_dt=ref_dt)

    assert streaks["current_streak"] == 1
    assert streaks["longest_streak"] == 1
    assert streaks["total_days_active"] == 1

def test_corrupted_and_empty_timestamps_handled_gracefully():
    # Empty list
    empty_res = StreakEngine.calculate_streaks([], timezone_name="UTC")
    assert empty_res["current_streak"] == 0
    assert empty_res["longest_streak"] == 0

    # List with None or empty strings
    dirty_res = StreakEngine.calculate_streaks([None, "", "2026-11-05T12:00:00Z"], timezone_name="UTC")
    assert dirty_res["total_days_active"] == 1

def test_merge_with_corrupted_timestamps():
    cloud = {
        "lc_1": {"problem_id": "lc_1", "status": "started", "updated_at": "invalid_date_format"}
    }
    guest = [
        {"problem_id": "lc_1", "status": "solved", "updated_at": "2026-11-05T12:00:00Z"}
    ]
    merged = MergeEngine.merge_problem_progress(cloud, guest)
    assert merged["lc_1"]["status"] == "solved"

def test_extreme_international_date_line_conversion():
    # Kiritimati (Line Islands, UTC+14) vs Midway (UTC-11)
    # When it's 2026-11-05 10:00 UTC:
    # In UTC+14: 2026-11-06 00:00
    # In UTC-11: 2026-11-04 23:00
    ts = "2026-11-05T10:00:00Z"
    date_kiritimati = StreakEngine.get_local_date_str(ts, "Pacific/Kiritimati")
    date_midway = StreakEngine.get_local_date_str(ts, "Pacific/Midway")

    assert date_kiritimati == "2026-11-06"
    assert date_midway == "2026-11-04"

