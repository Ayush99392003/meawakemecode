from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from zoneinfo import ZoneInfo

class StreakEngine:
    @staticmethod
    def get_local_date_str(iso_timestamp: str, timezone_name: str = "UTC") -> str:
        """Converts ISO timestamp into YYYY-MM-DD in the target IANA timezone."""
        try:
            tz = ZoneInfo(timezone_name)
        except Exception:
            tz = ZoneInfo("UTC")

        # Parse ISO string
        clean_iso = iso_timestamp.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_iso)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=ZoneInfo("UTC"))

        local_dt = dt.astimezone(tz)
        return local_dt.strftime("%Y-%m-%d")

    @classmethod
    def calculate_streaks(
        cls,
        solved_timestamps: List[str],
        timezone_name: str = "UTC",
        reference_dt: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Calculates current streak, longest streak, and total active days
        strictly relative to the user's local timezone.
        """
        if not solved_timestamps:
            return {
                "current_streak": 0,
                "longest_streak": 0,
                "total_days_active": 0,
                "last_active_date": None,
            }

        unique_local_dates = sorted(
            list({cls.get_local_date_str(ts, timezone_name) for ts in solved_timestamps if ts})
        )

        if not unique_local_dates:
            return {
                "current_streak": 0,
                "longest_streak": 0,
                "total_days_active": 0,
                "last_active_date": None,
            }

        # Reference time in target timezone
        if reference_dt is None:
            reference_dt = datetime.now(ZoneInfo(timezone_name))
        elif reference_dt.tzinfo is None:
            reference_dt = reference_dt.replace(tzinfo=ZoneInfo("UTC")).astimezone(ZoneInfo(timezone_name))
        else:
            reference_dt = reference_dt.astimezone(ZoneInfo(timezone_name))

        today_local = reference_dt.strftime("%Y-%m-%d")
        yesterday_local = (reference_dt - timedelta(days=1)).strftime("%Y-%m-%d")

        # Longest consecutive streak
        longest_streak = 1
        current_seq = 1

        for i in range(1, len(unique_local_dates)):
            prev_d = datetime.strptime(unique_local_dates[i - 1], "%Y-%m-%d")
            curr_d = datetime.strptime(unique_local_dates[i], "%Y-%m-%d")
            diff_days = (curr_d - prev_d).days

            if diff_days == 1:
                current_seq += 1
                if current_seq > longest_streak:
                    longest_streak = current_seq
            else:
                current_seq = 1

        # Current streak (must end today or yesterday)
        last_active = unique_local_dates[-1]
        current_streak = 0

        if last_active in (today_local, yesterday_local):
            current_streak = 1
            curr_target = datetime.strptime(last_active, "%Y-%m-%d")

            for i in range(len(unique_local_dates) - 2, -1, -1):
                expected_prev = curr_target - timedelta(days=1)
                prev_date_str = expected_prev.strftime("%Y-%m-%d")

                if unique_local_dates[i] == prev_date_str:
                    current_streak += 1
                    curr_target = expected_prev
                else:
                    break

        return {
            "current_streak": current_streak,
            "longest_streak": max(longest_streak, current_streak),
            "total_days_active": len(unique_local_dates),
            "last_active_date": last_active,
        }

