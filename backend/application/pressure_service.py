"""
Helpers for calculating lingering metric pressure from recent rounds.
This lets repeated neglect keep affecting future turns without extra DB columns.
"""

from domain.game import INITIAL_METRIC, PRESSURE_WINDOW, compute_lingering_pressure
from models import GameRound


def get_session_lingering_pressure(session_id: int) -> tuple[int, int, int]:
    """
    Inspect the last few realized rounds for a session and return pressure penalties
    for biosphere, society, and economy.
    """
    recent_rounds = (
        GameRound.query.filter_by(session_id=session_id)
        .order_by(GameRound.id.desc())
        .limit(PRESSURE_WINDOW)
        .all()
    )

    if not recent_rounds:
        return (0, 0, 0)

    recent_rounds.reverse()

    prior_round = (
        GameRound.query.filter_by(session_id=session_id)
        .order_by(GameRound.id.desc())
        .offset(PRESSURE_WINDOW)
        .first()
    )

    prev_biosphere = prior_round.biosphere_after if prior_round else INITIAL_METRIC
    prev_society = prior_round.society_after if prior_round else INITIAL_METRIC
    prev_economy = prior_round.economy_after if prior_round else INITIAL_METRIC

    biosphere_deltas: list[int] = []
    society_deltas: list[int] = []
    economy_deltas: list[int] = []

    for game_round in recent_rounds:
        biosphere_deltas.append(game_round.biosphere_after - prev_biosphere)
        society_deltas.append(game_round.society_after - prev_society)
        economy_deltas.append(game_round.economy_after - prev_economy)

        prev_biosphere = game_round.biosphere_after
        prev_society = game_round.society_after
        prev_economy = game_round.economy_after

    return (
        compute_lingering_pressure(biosphere_deltas),
        compute_lingering_pressure(society_deltas),
        compute_lingering_pressure(economy_deltas),
    )
