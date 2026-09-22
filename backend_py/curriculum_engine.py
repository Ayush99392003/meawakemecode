import re
from typing import Set, List, Dict, Any, Literal

CF_ID_REGEX = re.compile(r"^\d+[A-Z]\d*$")

class CurriculumEngine:
    @staticmethod
    def validate_cf_external_id(external_id: str) -> bool:
        """Validates contestId + problemIndex (e.g. 1850A, 71A, 158B, 1850A1)"""
        return bool(CF_ID_REGEX.match(external_id.strip()))

    @staticmethod
    def evaluate_day_status(
        day_number: int,
        completed_day_numbers: Set[int],
        problems_solved_for_day: int,
        total_problems_for_day: int = 5,
        strict_mode: bool = False
    ) -> Literal["locked", "unlocked", "completed", "in_progress"]:
        is_completed = (day_number in completed_day_numbers) or (problems_solved_for_day >= total_problems_for_day)
        if is_completed:
            return "completed"

        if problems_solved_for_day > 0:
            return "in_progress"

        if not strict_mode or day_number == 1:
            return "unlocked"

        # In strict mode, previous day must be complete
        return "unlocked" if (day_number - 1) in completed_day_numbers else "locked"

    @staticmethod
    def find_first_incomplete_day(completed_day_numbers: Set[int], total_days: int = 30) -> int:
        for day in range(1, total_days + 1):
            if day not in completed_day_numbers:
                return day
        return total_days

