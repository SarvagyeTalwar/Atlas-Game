"""
scripts/play_cli.py

Terminal Playtester for Atlas Kids:
Play a live Atlas game directly in your PowerShell terminal against the Neon cloud database!
Tests:
- Starting letter validation
- 4-Tier Educational Priority (AI picks Countries and Capitals first!)
- Auto-correcting misspelled places (e.g. 'Indonasia' -> 'Indonesia')
- Replay prevention
"""

import sys
import os

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.game_engine import play_turn


def run_cli_game():
    print("=" * 65)
    print("🌍 WELCOME TO ATLAS KIDS - TERMINAL PLAYTESTER")
    print("=" * 65)
    print("Rules: Name any world place to start.")
    print("The AI will name a place starting with the LAST letter of your place.")
    print("Type 'quit' or 'exit' anytime to end the game.\n")

    expected_letter = ""
    used_place_ids = []
    round_num = 1

    while True:
        prompt_letter = f"starting with '{expected_letter}'" if expected_letter else "any place"
        print(f"\n[Round {round_num}] Your Turn ({prompt_letter}):")
        user_input = input("👉 Enter place: ").strip()

        if user_input.lower() in ("quit", "exit"):
            print("\nThanks for playing Atlas Kids! 👋")
            break

        if not user_input:
            print("Please type a place name!")
            continue

        result = play_turn(user_input, expected_letter, used_place_ids)

        if not result["success"]:
            print(f"❌ {result['error']}")
            continue

        child_move = result["child_move"]
        print(f"✓ Accepted: {child_move['name']} ({child_move['type']})")
        if child_move.get("typo_note"):
            print(f"  💡 {child_move['typo_note']}")

        if result.get("game_over"):
            print(f"\n🎉 {result['message']}")
            break

        ai_move = result["ai_move"]
        print(f"\n🤖 AI Plays: {ai_move['name']} ({ai_move['type']})")
        print(f"   Coords: {ai_move['coordinates']}")

        used_place_ids = result["used_place_ids"]
        expected_letter = result["next_required_letter"]
        round_num += 1
        print(f"👉 Next letter for you: '{expected_letter}'")


if __name__ == "__main__":
    run_cli_game()
