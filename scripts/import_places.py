"""
scripts/import_places.py

Milestone 2: Database Ingestion Pipeline
Loads 158,000+ places from 'data/countries+states+cities.json' into Neon PostgreSQL.

Features:
1. Prefixes IDs (country_101, state_401, city_111) to eliminate ID collisions.
2. Implements the 4-Tier Educational Priority System:
   - Tier 1: Countries (e.g. India, France)
   - Tier 2: Capitals (e.g. New Delhi, Paris)
   - Tier 3: States & Provinces (e.g. California, Maharashtra)
   - Tier 4: Other Cities (e.g. Pune, Lyon)
3. Precomputes first_letter, last_letter, and normalized_name for fast lookups.
4. Uses batch execution (2,000 rows/batch) to insert everything in ~30 seconds.
5. Builds search & trigram fuzzy indexes.
"""

import os
import json
import time
import unicodedata
from dotenv import load_dotenv
import psycopg

# Load connection string from .env.local (or .env)
load_dotenv('.env.local')
load_dotenv('.env')

DATA_PATH = os.path.join("data", "countries+states+cities.json")
BATCH_SIZE = 2000


def clean_and_get_letters(name: str):
    """
    Cleans a place name:
    - Decomposes accents (São Paulo -> Sao Paulo)
    - Extracts pure A-Z first and last letters (ignoring punctuation/spaces)
    - Returns (first_letter, last_letter, normalized_name)
    """
    if not name or not isinstance(name, str):
        return None, None, ""

    decomposed = unicodedata.normalize('NFKD', name)
    ascii_clean = decomposed.encode('ascii', 'ignore').decode('utf-8').strip()

    alpha_chars = [c.upper() for c in ascii_clean if c.isalpha()]
    if not alpha_chars:
        return None, None, ascii_clean.lower()

    first_letter = alpha_chars[0]
    last_letter = alpha_chars[-1]
    normalized_name = ascii_clean.lower()
    return first_letter, last_letter, normalized_name


def parse_float(val):
    try:
        return float(val) if val is not None else None
    except (ValueError, TypeError):
        return None


def main():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("[!] ERROR: DATABASE_URL not found in .env.local or .env!")
        return

    if not os.path.exists(DATA_PATH):
        print(f"[!] ERROR: Dataset file not found at {DATA_PATH}")
        return

    print("=" * 60)
    print("🌍 ATLAS KIDS - DATABASE INGESTION PIPELINE")
    print("=" * 60)
    print(f"[*] Reading dataset: {DATA_PATH}")

    start_time = time.time()
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"[✓] JSON loaded in {time.time() - start_time:.2f} seconds. Parsing places...")

    # Connect to Neon Postgres
    print("[*] Connecting to Neon PostgreSQL...")
    conn = psycopg.connect(db_url)
    conn.autocommit = False

    with conn.cursor() as cur:
        # 1. Enable fuzzy matching extension
        cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")

        # 2. Create the unified places table
        print("[*] Creating 'places' table if it doesn't exist...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS places (
                id VARCHAR(64) PRIMARY KEY,
                source_id INTEGER,
                name VARCHAR(255) NOT NULL,
                normalized_name VARCHAR(255) NOT NULL,
                place_type VARCHAR(20) NOT NULL,
                tier SMALLINT NOT NULL,
                country_id VARCHAR(64),
                state_id VARCHAR(64),
                latitude DOUBLE PRECISION,
                longitude DOUBLE PRECISION,
                first_letter CHAR(1) NOT NULL,
                last_letter CHAR(1) NOT NULL
            );
        """)

        # 3. Traverse hierarchy and prepare rows
        rows_to_insert = []
        capitals_by_country = {}

        # First pass: map country capitals for Tier 2 detection
        for country in data:
            c_id = f"country_{country['id']}"
            cap_name = country.get("capital")
            if cap_name:
                _, _, norm_cap = clean_and_get_letters(cap_name)
                capitals_by_country[c_id] = norm_cap

        # Second pass: extract Countries, States, and Cities
        skipped_count = 0
        for country in data:
            c_raw_name = country.get("name", "").strip()
            c_first, c_last, c_norm = clean_and_get_letters(c_raw_name)

            if not c_first or not c_last:
                skipped_count += 1
                continue

            c_id = f"country_{country['id']}"
            # Country = Tier 1 (Highest Priority)
            rows_to_insert.append((
                c_id,
                country.get("id"),
                c_raw_name,
                c_norm,
                "country",
                1,
                c_id,
                None,
                parse_float(country.get("latitude")),
                parse_float(country.get("longitude")),
                c_first,
                c_last
            ))

            # Process States
            for state in country.get("states", []):
                s_raw_name = state.get("name", "").strip()
                s_first, s_last, s_norm = clean_and_get_letters(s_raw_name)

                if not s_first or not s_last:
                    skipped_count += 1
                    continue

                s_id = f"state_{state['id']}"
                # State = Tier 3
                rows_to_insert.append((
                    s_id,
                    state.get("id"),
                    s_raw_name,
                    s_norm,
                    "state",
                    3,
                    c_id,
                    s_id,
                    parse_float(state.get("latitude")),
                    parse_float(state.get("longitude")),
                    s_first,
                    s_last
                ))

                # Process Cities
                for city in state.get("cities", []):
                    ci_raw_name = city.get("name", "").strip()
                    ci_first, ci_last, ci_norm = clean_and_get_letters(ci_raw_name)

                    if not ci_first or not ci_last:
                        skipped_count += 1
                        continue

                    ci_id = f"city_{city['id']}"
                    # Check if this city is the national capital (Tier 2) or standard city (Tier 4)
                    is_capital = (c_id in capitals_by_country and ci_norm == capitals_by_country[c_id])
                    tier = 2 if is_capital else 4

                    rows_to_insert.append((
                        ci_id,
                        city.get("id"),
                        ci_raw_name,
                        ci_norm,
                        "city",
                        tier,
                        c_id,
                        s_id,
                        parse_float(city.get("latitude")),
                        parse_float(city.get("longitude")),
                        ci_first,
                        ci_last
                    ))

        total_rows = len(rows_to_insert)
        print(f"[✓] Prepared {total_rows:,} validated places ({skipped_count} skipped).")

        # 4. Batch Insertion
        print(f"[*] Inserting into Neon PostgreSQL in batches of {BATCH_SIZE}...")
        insert_sql = """
            INSERT INTO places (
                id, source_id, name, normalized_name, place_type, tier,
                country_id, state_id, latitude, longitude, first_letter, last_letter
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING;
        """

        insert_start = time.time()
        for i in range(0, total_rows, BATCH_SIZE):
            batch = rows_to_insert[i:i + BATCH_SIZE]
            cur.executemany(insert_sql, batch)
            percent = (min(i + BATCH_SIZE, total_rows) / total_rows) * 100
            print(f"    -> Progress: {min(i + BATCH_SIZE, total_rows):,}/{total_rows:,} rows ({percent:.1f}%)")

        conn.commit()
        print(f"[✓] Data inserted successfully in {time.time() - insert_start:.2f} seconds!")

        # 5. Build Performance Indexes
        print("[*] Creating database indexes for sub-millisecond AI answers...")
        # Index for AI queries: WHERE first_letter = 'X' ORDER BY tier ASC
        cur.execute("CREATE INDEX IF NOT EXISTS idx_places_letter_tier ON places (first_letter, tier);")
        # Index for exact player search
        cur.execute("CREATE INDEX IF NOT EXISTS idx_places_norm_name ON places (normalized_name);")
        # Trigram GIN index for typo/autocorrect suggestions
        cur.execute("CREATE INDEX IF NOT EXISTS idx_places_trgm ON places USING gin (normalized_name gin_trgm_ops);")
        conn.commit()

        # 6. Verify Final Counts
        cur.execute("SELECT count(*), tier FROM places GROUP BY tier ORDER BY tier;")
        counts = cur.fetchall()
        tier_names = {1: "Countries", 2: "Capitals", 3: "States", 4: "Cities"}
        print("\n" + "=" * 60)
        print("📊 FINAL INGESTION SUMMARY:")
        print("=" * 60)
        for count, tier in counts:
            print(f"  • Tier {tier} ({tier_names.get(tier, 'Other')}): {count:,} places")

        cur.execute("SELECT count(*) FROM places;")
        total_in_db = cur.fetchone()[0]
        print(f"  ⭐ Total Places in Database: {total_in_db:,}")
        print("=" * 60)

    conn.close()
    print(f"\n[🎉] Done! Entire pipeline completed in {time.time() - start_time:.2f} seconds.")


if __name__ == "__main__":
    main()
