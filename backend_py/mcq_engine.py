from typing import Dict, Any, List
from .models import DayQuestion, MCQOptionKey

class MCQEngine:
    @staticmethod
    def evaluate_submission(
        question: DayQuestion,
        selected_option: MCQOptionKey
    ) -> Dict[str, Any]:
        is_correct = selected_option == question.correct_option
        return {
            "question_id": question.id,
            "selected_option": selected_option,
            "is_correct": is_correct,
            "correct_option": question.correct_option,
            "detailed_explanation": question.detailed_explanation,
        }

    @staticmethod
    def calculate_score_summary(
        questions: List[DayQuestion],
        attempts: Dict[str, MCQOptionKey]
    ) -> Dict[str, Any]:
        total_q = len(questions)
        attempted = len(attempts)
        correct_count = 0

        for q in questions:
            if q.id in attempts and attempts[q.id] == q.correct_option:
                correct_count += 1

        percentage = round((correct_count / total_q) * 100) if total_q > 0 else 0
        return {
            "total_questions": total_q,
            "attempted": attempted,
            "correct": correct_count,
            "percentage": percentage,
        }

