from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from django.db.models import Prefetch

from .models import Enterprise, QuestionResponse, Question, Category, ScoreSummary


IMMEDIATE_PRIORITY_SET = {1, 2}


@dataclass
class SectionScore:
    weighted_total: int
    max_total: int

    @property
    def percentage(self) -> float:
        if self.max_total == 0:
            return 0.0
        return (self.weighted_total / self.max_total) * 100.0


def _question_ratio(score: int, weight: int) -> Tuple[int, int]:
    if score < 0:
        return 0, 0
    clamped = max(0, min(score, 4))
    weighted = clamped * weight
    max_per_q = weight * 4
    return weighted, max_per_q


def compute_scores_for_enterprise(enterprise: Enterprise) -> Dict:
    responses = (
        QuestionResponse.objects
        .filter(enterprise=enterprise)
        .select_related('question', 'question__category')
    )

    section_accumulator: Dict[int, SectionScore] = {}
    priorities: Dict[str, Dict] = {}

    for response in responses:
        question: Question = response.question
        category: Category = question.category
        weighted, max_per_q = _question_ratio(response.score, question.weight)

        if category.id not in section_accumulator:
            section_accumulator[category.id] = SectionScore(0, 0)
        acc = section_accumulator[category.id]
        acc.weighted_total += weighted
        acc.max_total += max_per_q

        code = f"{question.number}"
        action_required = 'N'
        if response.score >= 0:
            if (question.priority in IMMEDIATE_PRIORITY_SET and response.score <= 2):
                action_required = 'Y'
        else:
            action_required = 'N'

        priorities[code] = {
            'priority': question.priority,
            'raw_score': None if response.score < 0 else response.score,
            'action_required': action_required,
        }

    section_scores_out: Dict[str, Dict] = {}
    total_weighted = 0
    total_max = 0
    for category in Category.objects.all():
        acc = section_accumulator.get(category.id, SectionScore(0, 0))
        section_scores_out[category.name] = {
            'weighted': acc.weighted_total,
            'perfect': acc.max_total,
            'percentage': round(acc.percentage, 2),
        }
        total_weighted += acc.weighted_total
        total_max += acc.max_total

    overall_percentage = round(((total_weighted / total_max) * 100.0) if total_max else 0.0, 2)

    return {
        'overall_percentage': overall_percentage,
        'section_scores': section_scores_out,
        'priorities': priorities,
    }


def recompute_and_store_summary(enterprise: Enterprise) -> ScoreSummary:
    data = compute_scores_for_enterprise(enterprise)
    summary, _ = ScoreSummary.objects.update_or_create(
        enterprise=enterprise,
        defaults={
            'overall_percentage': data['overall_percentage'],
            'section_scores': data['section_scores'],
            'priorities': data['priorities'],
        }
    )
    return summary



