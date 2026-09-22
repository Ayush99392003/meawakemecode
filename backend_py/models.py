from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Dict, Any, Literal

Platform = Literal["LC", "CF"]
ProblemStatus = Literal["not_started", "started", "solved", "revisit"]
MCQOptionKey = Literal["A", "B", "C", "D"]
QuestionDifficulty = Literal["easy", "medium", "hard"]

@dataclass
class Problem:
    id: str
    platform: Platform
    external_id: str
    title: str
    url: str
    difficulty: str
    tags: List[str] = field(default_factory=list)
    hint: Optional[str] = None
    expected_time_complexity: Optional[str] = None
    expected_space_complexity: Optional[str] = None
    expected_pattern: Optional[str] = None
    status: Literal["active", "broken_link", "archived"] = "active"

@dataclass
class MCQOption:
    key: MCQOptionKey
    text: str

@dataclass
class DayQuestion:
    id: str
    day_id: str
    topic: str
    question: str
    options: List[MCQOption]
    correct_option: MCQOptionKey
    detailed_explanation: str
    difficulty: QuestionDifficulty = "medium"
    code_snippet: Optional[str] = None
    order_index: int = 1

    def to_public_dict(self) -> Dict[str, Any]:
        """Strips correct answer and explanation to prevent client cheating"""
        return {
            "id": self.id,
            "day_id": self.day_id,
            "topic": self.topic,
            "question": self.question,
            "options": [{"key": opt.key, "text": opt.text} for opt in self.options],
            "difficulty": self.difficulty,
            "code_snippet": self.code_snippet,
            "order_index": self.order_index,
        }

@dataclass
class UserProblemProgress:
    problem_id: str
    status: ProblemStatus
    solved_at: Optional[str] = None
    attempts_count: int = 0
    personal_time_seconds: Optional[int] = None
    personal_note: Optional[str] = None
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

