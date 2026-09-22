from datetime import datetime
from typing import Dict, Any, List

class MergeEngine:
    @staticmethod
    def parse_timestamp_safe(ts_str: Any) -> float:
        if not ts_str or not isinstance(ts_str, str):
            return 0.0
        try:
            clean = ts_str.replace("Z", "+00:00")
            return datetime.fromisoformat(clean).timestamp()
        except Exception:
            return 0.0

    @classmethod
    def merge_problem_progress(
        cls,
        cloud_records: Dict[str, Dict[str, Any]],
        guest_records: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        merged = dict(cloud_records)

        for guest in guest_records:
            pid = guest.get("problem_id")
            if not pid:
                continue

            if pid not in merged:
                merged[pid] = guest
            else:
                cloud = merged[pid]
                cloud_time = max(
                    cls.parse_timestamp_safe(cloud.get("updated_at")),
                    cls.parse_timestamp_safe(cloud.get("solved_at"))
                )
                guest_time = max(
                    cls.parse_timestamp_safe(guest.get("updated_at")),
                    cls.parse_timestamp_safe(guest.get("solved_at"))
                )

                if guest_time > cloud_time:
                    merged[pid] = guest

        return merged

