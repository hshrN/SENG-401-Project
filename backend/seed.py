import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, Card

cards = [
    {
        "scenario_text": "A developing nation requests debt relief to fund climate adaptation projects. Cancelling the debt would free up resources but strain international creditors.",
        "decision_a": "Cancel the debt unconditionally",
        "decision_b": "Offer conditional debt restructuring",
        "a_biosphere": 8, "a_society": 10, "a_economy": -12,
        "b_biosphere": 4, "b_society": 5,  "b_economy": -5,
    },
    {
        "scenario_text": "A major corporation offers to fund reforestation in exchange for carbon credit offsets that reduce their reported emissions.",
        "decision_a": "Accept the deal and begin reforestation",
        "decision_b": "Reject greenwashing, demand real cuts",
        "a_biosphere": 10, "a_society": 2, "a_economy": 6,
        "b_biosphere": 3,  "b_society": 8, "b_economy": -8,
    },
    {
        "scenario_text": "Global food prices spike after a regional drought. Exporting nations can maintain domestic supply or fulfill international aid commitments.",
        "decision_a": "Restrict exports to protect domestic supply",
        "decision_b": "Honor aid commitments, accept local shortage",
        "a_biosphere": 0, "a_society": -10, "a_economy": 5,
        "b_biosphere": 2,  "b_society": 10, "b_economy": -9,
    },
    {
        "scenario_text": "A new trade agreement would boost economic growth but includes weaker environmental standards for member nations.",
        "decision_a": "Sign the agreement as written",
        "decision_b": "Negotiate stronger environmental clauses",
        "a_biosphere": -10, "a_society": 3,  "a_economy": 10,
        "b_biosphere": 5,   "b_society": 5,  "b_economy": -4,
    },
    {
        "scenario_text": "An NGO proposes a global health initiative but requires wealthy nations to divert infrastructure funds.",
        "decision_a": "Fund the global health initiative",
        "decision_b": "Prioritize domestic infrastructure",
        "a_biosphere": 2,  "a_society": 10, "a_economy": -9,
        "b_biosphere": 0,  "b_society": -5, "b_economy": 8,
    },
    {
        "scenario_text": "A fossil fuel company offers to transition to renewables if given a 10-year subsidy from the public budget.",
        "decision_a": "Grant the subsidy deal",
        "decision_b": "Deny subsidy, enforce carbon tax instead",
        "a_biosphere": 7,  "a_society": 4,  "a_economy": -10,
        "b_biosphere": 9,  "b_society": 2,  "b_economy": -6,
    },
    {
        "scenario_text": "Rising sea levels threaten a small island nation. Relocating the population would cost billions and disrupt regional partnerships.",
        "decision_a": "Fund full relocation immediately",
        "decision_b": "Build seawalls and delay relocation",
        "a_biosphere": 3,  "a_society": 10, "a_economy": -12,
        "b_biosphere": -5, "b_society": 4,  "b_economy": -3,
    },
    {
        "scenario_text": "A UN resolution proposes binding emissions targets. Signing reduces sovereignty but signals global commitment.",
        "decision_a": "Sign the binding resolution",
        "decision_b": "Support a weaker voluntary agreement",
        "a_biosphere": 10, "a_society": 6,  "a_economy": -8,
        "b_biosphere": 3,  "b_society": 2,  "b_economy": 2,
    },
    {
        "scenario_text": "Illegal fishing in international waters is depleting shared fish stocks. Enforcement requires costly naval patrols.",
        "decision_a": "Deploy patrols and enforce limits",
        "decision_b": "Issue warnings and negotiate bilaterally",
        "a_biosphere": 10, "a_society": 3,  "a_economy": -8,
        "b_biosphere": 2,  "b_society": 5,  "b_economy": 0,
    },
    {
        "scenario_text": "A pandemic in a low-income region threatens to spread globally. Sending vaccine stockpiles helps them but depletes your reserves.",
        "decision_a": "Share vaccines internationally",
        "decision_b": "Secure your own population first",
        "a_biosphere": 0,  "a_society": 10, "a_economy": -5,
        "b_biosphere": 0,  "b_society": -8, "b_economy": 4,
    },
    {
        "scenario_text": "A tech company wants to build data centers in a biodiverse region, creating jobs but threatening ecosystems.",
        "decision_a": "Approve the development with conditions",
        "decision_b": "Reject and protect the region",
        "a_biosphere": -9, "a_society": 5,  "a_economy": 10,
        "b_biosphere": 10, "b_society": 0,  "b_economy": -6,
    },
    {
        "scenario_text": "International climate negotiations stall. You can broker a deal only by offering financial concessions to reluctant nations.",
        "decision_a": "Make concessions to secure the deal",
        "decision_b": "Hold firm and risk collapse of talks",
        "a_biosphere": 8,  "a_society": 7,  "a_economy": -10,
        "b_biosphere": -4, "b_society": -3, "b_economy": 2,
    },
    {
        "scenario_text": "Wildfires cross national borders. Coordinated firefighting requires sharing military aircraft, raising sovereignty concerns.",
        "decision_a": "Share aircraft in a joint response",
        "decision_b": "Manage fires independently",
        "a_biosphere": 9,  "a_society": 6,  "a_economy": -4,
        "b_biosphere": -8, "b_society": -2, "b_economy": 0,
    },
    {
        "scenario_text": "A nation proposes a global plastic tax to fund ocean cleanup. Implementation would raise consumer prices worldwide.",
        "decision_a": "Champion the plastic tax",
        "decision_b": "Support voluntary industry pledges instead",
        "a_biosphere": 10, "a_society": -4, "a_economy": -7,
        "b_biosphere": 2,  "b_society": 3,  "b_economy": 3,
    },
    {
        "scenario_text": "Rare earth minerals critical for green technology lie under an indigenous community's land. Mining requires consent negotiations.",
        "decision_a": "Negotiate consent and mine sustainably",
        "decision_b": "Halt extraction and find alternatives",
        "a_biosphere": -5, "a_society": 5,  "a_economy": 9,
        "b_biosphere": 6,  "b_society": 8,  "b_economy": -10,
    },
]

def seed():
    with app.app_context():
        existing = Card.query.count()
        if existing > 0:
            print(f"Cards table already has {existing} rows. Skipping seed.")
            return
        for data in cards:
            card = Card(**data)
            db.session.add(card)
        db.session.commit()
        print(f"✅ Seeded {len(cards)} cards successfully.")

if __name__ == '__main__':
    seed()