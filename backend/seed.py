import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from argon2 import PasswordHasher

from app import app
from models import db, Scenario, Player

ph = PasswordHasher()

# Test accounts (only created if they don't exist). Use these to log in without signing up.
TEST_USERS = [
    {"username": "test", "password": "test123"},
    {"username": "demo", "password": "demo123"},
]

scenarios = [
    {
        "scenario_text": "A bloc of climate-vulnerable nations demands immediate debt relief after back-to-back storms. Creditors warn that writing it off could raise borrowing costs across the region.",
        "decision_a": "Back immediate relief",
        "decision_b": "Tie relief to reforms",
        "a_biosphere": 2, "a_society": 5, "a_economy": -8,
        "b_biosphere": 0, "b_society": 1, "b_economy": 5,
        "phase": "early",
    },
    {
        "scenario_text": "A conglomerate offers to bankroll forest recovery if its offset claims are certified under a weak international standard. Accepting unlocks cash fast, but could undermine pressure for direct cuts.",
        "decision_a": "Approve the offset pact",
        "decision_b": "Force direct emissions cuts",
        "a_biosphere": 4, "a_society": 0, "a_economy": 5,
        "b_biosphere": 2, "b_society": 4, "b_economy": -7,
        "phase": "early",
    },
    {
        "scenario_text": "A drought-driven harvest failure sends grain prices soaring across allied states. Export controls could calm your home market, but partners warn it will deepen shortages abroad.",
        "decision_a": "Lock down exports",
        "decision_b": "Keep aid shipments moving",
        "a_biosphere": -2, "a_society": -7, "a_economy": 8,
        "b_biosphere": 0,  "b_society": 6, "b_economy": -5,
        "phase": "early",
    },
    {
        "scenario_text": "A fast-moving trade pact promises jobs and supply access, but the current draft strips out most environmental safeguards. Negotiators say reopening it could collapse the whole agreement.",
        "decision_a": "Sign the pact now",
        "decision_b": "Reopen the environmental terms",
        "a_biosphere": -8, "a_society": 1,  "a_economy": 9,
        "b_biosphere": 4,  "b_society": 3,  "b_economy": -6,
        "phase": "early",
    },
    {
        "scenario_text": "A coalition health fund can stop an outbreak from spreading, but it would pull money out of domestic infrastructure plans. Walking away protects budgets, yet weak states may buckle.",
        "decision_a": "Divert funds to the coalition",
        "decision_b": "Protect the home buildout",
        "a_biosphere": 0,  "a_society": 6, "a_economy": -6,
        "b_biosphere": -2, "b_society": -7, "b_economy": 7,
        "phase": "early",
    },
    {
        "scenario_text": "A fossil consortium offers a managed transition if governments guarantee subsidies and grid protection during the switch. Refusing the deal could trigger layoffs and price shocks in the short run.",
        "decision_a": "Guarantee the transition package",
        "decision_b": "Force the shift without subsidies",
        "a_biosphere": 2,  "a_society": 0,  "a_economy": 5,
        "b_biosphere": 6,  "b_society": 1,  "b_economy": -6,
        "phase": "early",
    },
    {
        "scenario_text": "A low-lying island partner is demanding relocation support before the next cyclone season. Delaying action buys time for your budget, but local leaders say partial measures could trap families in place.",
        "decision_a": "Fund relocation corridors",
        "decision_b": "Delay with temporary defenses",
        "a_biosphere": 0,  "a_society": 6, "a_economy": -7,
        "b_biosphere": -6, "b_society": -1, "b_economy": 5,
        "phase": "early",
    },
    {
        "scenario_text": "A binding emissions treaty is back on the table after several heat disasters. Signing would lock in expensive obligations now, while a softer deal may preserve room to maneuver at home.",
        "decision_a": "Sign the binding treaty",
        "decision_b": "Push a voluntary framework",
        "a_biosphere": 6, "a_society": -2, "a_economy": -5,
        "b_biosphere": 0, "b_society": -2, "b_economy": 5,
        "phase": "early",
    },
    {
        "scenario_text": "Illegal industrial fleets are stripping shared waters faster than coastal nations can recover. A hard enforcement push would protect stocks, but it also militarizes the dispute and disrupts trade lanes.",
        "decision_a": "Launch joint enforcement patrols",
        "decision_b": "Settle for diplomatic warnings",
        "a_biosphere": 7, "a_society": -2, "a_economy": -5,
        "b_biosphere": -3, "b_society": 1,  "b_economy": 5,
        "phase": "early",
    },
    {
        "scenario_text": "A new variant is spreading through an under-resourced region that anchors several trade routes. Sharing stockpiles early could slow the wave, but domestic leaders warn of shortages if the surge reaches home.",
        "decision_a": "Release stockpiles abroad",
        "decision_b": "Reserve doses for home use",
        "a_biosphere": 0,  "a_society": 7, "a_economy": -5,
        "b_biosphere": -1, "b_society": -9, "b_economy": 7,
        "phase": "early",
    },
    {
        "scenario_text": "A rush to build data centers around a rare-mineral corridor could anchor new jobs, but it would also stress water systems and fragment habitat. Investors say delaying now could send the whole cluster elsewhere.",
        "decision_a": "Approve the corridor buildout",
        "decision_b": "Freeze the corridor permits",
        "a_biosphere": -8, "a_society": 2,  "a_economy": 9,
        "b_biosphere": 6,  "b_society": -1, "b_economy": -5,
        "phase": "late",
    },
    {
        "scenario_text": "Climate talks are near collapse after several states refuse to sign without side payments and exemptions. Buying the deal may keep the coalition alive, but it could normalize brinkmanship for every future summit.",
        "decision_a": "Buy the agreement this round",
        "decision_b": "Call the bluff and risk fracture",
        "a_biosphere": 4,  "a_society": 3,  "a_economy": -7,
        "b_biosphere": -6, "b_society": -6, "b_economy": 5,
        "phase": "late",
    },
    {
        "scenario_text": "Wildfire smoke and infrastructure damage are now crossing multiple borders at once. A pooled emergency response would save forests faster, but it would also trigger backlash from governments already wary of outside command.",
        "decision_a": "Pool command and aircraft",
        "decision_b": "Keep response national",
        "a_biosphere": 6,  "a_society": -1, "a_economy": -4,
        "b_biosphere": -7, "b_society": -4, "b_economy": 5,
        "phase": "late",
    },
    {
        "scenario_text": "An emergency plastics levy could finally fund cleanup at scale, but consumer prices are already rising and several governments are on the edge of protests. A softer voluntary plan may calm markets while letting waste keep accumulating.",
        "decision_a": "Impose the levy anyway",
        "decision_b": "Settle for a voluntary pact",
        "a_biosphere": 5,  "a_society": -5, "a_economy": 0,
        "b_biosphere": -4, "b_society": 1,  "b_economy": 4,
        "phase": "late",
    },
    {
        "scenario_text": "A green-manufacturing boom depends on minerals beneath indigenous land and fragile watersheds. Mining now could lock in strategic supply, but walking away may leave the coalition exposed during the energy buildout.",
        "decision_a": "Open a controlled mining corridor",
        "decision_b": "Protect the region and reroute supply",
        "a_biosphere": -6, "a_society": 1,  "a_economy": 8,
        "b_biosphere": 4,  "b_society": 3,  "b_economy": -7,
        "phase": "late",
    },
]

def seed():
    with app.app_context():
        added_users = 0
        for u in TEST_USERS:
            if Player.query.filter_by(username=u["username"]).first() is None:
                player = Player(username=u["username"], password_hash=ph.hash(u["password"]))
                db.session.add(player)
                added_users += 1

        existing = Scenario.query.count()
        if existing == 0:
            for data in scenarios:
                scenario = Scenario(**data)
                db.session.add(scenario)

        db.session.commit()
        if added_users:
            print("✅ Created test accounts: test/test123, demo/demo123")
        if existing == 0:
            print(f"✅ Seeded {len(scenarios)} scenarios successfully.")
        elif existing > 0:
            print(f"Scenarios already have {existing} rows. Skipped scenario seed.")

if __name__ == '__main__':
    seed()
