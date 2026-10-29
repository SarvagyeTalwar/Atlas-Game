"""
backend/game_engine.py

Core Game Logic for Atlas Kids:
- Move validation (Letter matching, duplicate checks)
- Educational 4-Tier AI move selection (Countries -> Capitals -> States -> Cities)
- Smart Typo Resolution via PostgreSQL pg_trgm
- Deduplication by highest tier
"""

import os
import unicodedata
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row

load_dotenv('.env.local')
load_dotenv('.env')

DB_URL = os.getenv("DATABASE_URL")


def get_connection():
    if not DB_URL:
        raise ValueError("DATABASE_URL is not configured in .env.local")
    return psycopg.connect(DB_URL, row_factory=dict_row)


def normalize_input(text: str):
    """Decomposes accents, strips non-alphabetic chars, and returns (clean_letters, normalized_str)."""
    if not text or not isinstance(text, str):
        return [], ""
    decomposed = unicodedata.normalize('NFKD', text)
    ascii_clean = decomposed.encode('ascii', 'ignore').decode('utf-8').strip()
    alpha_chars = [c.upper() for c in ascii_clean if c.isalpha()]
    return alpha_chars, ascii_clean.lower()


def resolve_place(user_input: str, conn):
    """
    Finds the best place match for user input:
    1. Exact match on normalized_name (highest tier wins).
    2. If no exact match, uses pg_trgm fuzzy search (similarity > 0.38).
    """
    alpha_chars, norm_query = normalize_input(user_input)
    if not alpha_chars or not norm_query:
        return None, "empty_input"

    with conn.cursor() as cur:
        # 1. Exact Match
        cur.execute("""
            SELECT id, name, normalized_name, place_type, tier, 
                   country_id, latitude, longitude, first_letter, last_letter
            FROM places
            WHERE normalized_name = %s
            ORDER BY tier ASC
            LIMIT 1;
        """, (norm_query,))
        exact = cur.fetchone()
        if exact:
            return exact, None

        # 2. Fuzzy Match via pg_trgm
        cur.execute("""
            SELECT id, name, normalized_name, place_type, tier, 
                   country_id, latitude, longitude, first_letter, last_letter,
                   similarity(normalized_name, %s) AS sim
            FROM places
            WHERE normalized_name %% %s AND similarity(normalized_name, %s) > 0.38
            ORDER BY sim DESC, tier ASC
            LIMIT 1;
        """, (norm_query, norm_query, norm_query))
        fuzzy = cur.fetchone()
        if fuzzy:
            return fuzzy, f"Auto-corrected to '{fuzzy['name']}'"

    return None, "place_not_found"


def choose_ai_move(required_letter: str, used_place_ids: list, conn):
    """
    Selects the AI's move using the 4-Tier Educational Priority System:
    Tier 1 (Country) -> Tier 2 (Capital) -> Tier 3 (State) -> Tier 4 (City)
    """
    req = required_letter.upper()
    used_set = list(used_place_ids) if used_place_ids else []

    with conn.cursor() as cur:
        # If there are used places, exclude them
        if used_set:
            cur.execute("""
                SELECT id, name, place_type, tier, latitude, longitude, first_letter, last_letter
                FROM places
                WHERE first_letter = %s AND id != ALL(%s)
                ORDER BY tier ASC, RANDOM()
                LIMIT 1;
            """, (req, used_set))
        else:
            cur.execute("""
                SELECT id, name, place_type, tier, latitude, longitude, first_letter, last_letter
                FROM places
                WHERE first_letter = %s
                ORDER BY tier ASC, RANDOM()
                LIMIT 1;
            """, (req,))

        return cur.fetchone()


def play_turn(child_input: str, expected_letter: str, used_place_ids: list):
    """
    Executes a complete Atlas game turn:
    1. Resolves child's place (handles duplicates & typos)
    2. Validates letter match & duplicate play
    3. Picks AI's response using the Tier system
    4. Computes next required letter
    """
    with get_connection() as conn:
        # Step 1: Find place
        child_place, typo_note = resolve_place(child_input, conn)
        if not child_place:
            return {
                "success": False,
                "error": f"'{child_input}' isn't recognized as a world place. Try another one!"
            }

        # Step 2: Validate starting letter (if this isn't turn 1)
        if expected_letter:
            req = expected_letter.upper()
            if child_place["first_letter"] != req:
                return {
                    "success": False,
                    "error": f"'{child_place['name']}' starts with '{child_place['first_letter']}', but you need a place starting with '{req}'!"
                }

        # Step 3: Validate not already used
        if child_place["id"] in (used_place_ids or []):
            return {
                "success": False,
                "error": f"'{child_place['name']}' has already been played in this game! Think of another one."
            }

        # Update used places with child's move
        updated_used_ids = list(used_place_ids or [])
        updated_used_ids.append(child_place["id"])

        # Determine AI required letter (child's last letter)
        ai_required_letter = child_place["last_letter"]

        # Step 4: AI picks an answer
        ai_place = choose_ai_move(ai_required_letter, updated_used_ids, conn)
        if not ai_place:
            return {
                "success": True,
                "game_over": True,
                "winner": "child",
                "message": f"Incredible! I don't know any unused places starting with '{ai_required_letter}'. You win!",
                "child_move": child_place,
                "typo_note": typo_note
            }

        updated_used_ids.append(ai_place["id"])
        next_child_letter = ai_place["last_letter"]

        tier_labels = {1: "Country", 2: "Capital City", 3: "State/Region", 4: "City"}

        return {
            "success": True,
            "child_move": {
                "id": child_place["id"],
                "name": child_place["name"],
                "type": tier_labels.get(child_place["tier"], "City"),
                "coordinates": [child_place["latitude"], child_place["longitude"]],
                "typo_note": typo_note
            },
            "ai_move": {
                "id": ai_place["id"],
                "name": ai_place["name"],
                "type": tier_labels.get(ai_place["tier"], "City"),
                "coordinates": [ai_place["latitude"], ai_place["longitude"]],
            },
            "next_required_letter": next_child_letter,
            "used_place_ids": updated_used_ids
        }
