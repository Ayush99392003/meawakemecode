import time
from typing import Dict, Any, List, Set, Tuple

class CodeforcesEngine:
    def __init__(self, min_interval_seconds: float = 2.0):
        self.min_interval = min_interval_seconds
        self.last_call_times: Dict[str, float] = {}

    def check_rate_limit(self, handle: str) -> Tuple[bool, float]:
        clean = handle.strip().lower()
        now = time.time()
        last = self.last_call_times.get(clean, 0.0)
        elapsed = now - last

        if elapsed < self.min_interval:
            return False, self.min_interval - elapsed

        self.last_call_times[clean] = now
        return True, 0.0

    @staticmethod
    def extract_accepted_problems(submissions: List[Dict[str, Any]]) -> Set[str]:
        accepted = set()
        for sub in submissions:
            if sub.get("verdict") == "OK":
                prob = sub.get("problem", {})
                cid = prob.get("contestId")
                idx = prob.get("index")
                if cid and idx:
                    external_id = f"{cid}{str(idx).upper()}"
                    accepted.add(external_id)
        return accepted

