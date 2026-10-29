"""
scripts/inspect_data.py

Milestone 1: Read-only Data Inspection & Sanity Audit
Inspects 'countries+states+cities.json' without modifying anything.
Generates:
1. Shape and total record counts (Countries, States, Cities).
2. Missing / dirty data audit (missing coordinates, null names).
3. Country place distribution (which countries have the most places).
4. The A-Z Letter Frequency Matrix (vital for Atlas game balance).
5. Bottleneck letter detection (letters with dangerously few places).
"""

import os
import json
import unicodedata
from collections import Counter
from datetime import datetime


def clean_and_get_letters(name: str):
    """
    Cleans a place name and extracts the true first and last alphabetic letters.
    Handles accents/diacritics, spaces, and punctuation (e.g., 'Washington, D.C.').
    """
    if not name or not isinstance(name, str):
        return None, None, ""

    # Normalize unicode (e.g. 'São Paulo' -> 'Sao Paulo', 'München' -> 'Munchen')
    decomposed = unicodedata.normalize('NFKD', name)
    ascii_clean = decomposed.encode('ascii', 'ignore').decode('utf-8')

    # Extract only alphabetic letters
    alpha_chars = [c.upper() for c in ascii_clean if c.isalpha()]

    if not alpha_chars:
        return None, None, ascii_clean.strip()

    first_letter = alpha_chars[0]
    last_letter = alpha_chars[-1]
    return first_letter, last_letter, ascii_clean.strip()


def validate_coordinates(lat, lng):
    """Checks whether coordinates are valid floats within realistic ranges."""
    try:
        if lat is None or lng is None:
            return False
        f_lat = float(lat)
        f_lng = float(lng)
        # Lat: -90 to +90, Lng: -180 to +180
        if -90.0 <= f_lat <= 90.0 and -180.0 <= f_lng <= 180.0:
            return True
        return False
    except (ValueError, TypeError):
        return False


def run_inspection(json_path: str, report_path: str):
    print(f"[*] Starting data inspection on: {json_path}")
    if not os.path.exists(json_path):
        print(f"[!] Error: File not found at {json_path}")
        return

    file_size_mb = os.path.getsize(json_path) / (1024 * 1024)
    print(f"[*] File Size: {file_size_mb:.2f} MB")

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not isinstance(data, list):
        print(f"[!] Warning: Top level structure is {type(data)}, expected a list.")
        return

    # Metrics
    total_countries = len(data)
    total_states = 0
    total_cities = 0

    first_letter_counts = Counter()
    last_letter_counts = Counter()
    country_place_counts = Counter()

    missing_coords_count = 0
    invalid_letter_count = 0
    sample_records = {"country": None, "state": None, "city": None}

    # Traverse hierarchical JSON: Country -> States -> Cities
    for country in data:
        c_name = country.get("name", "").strip()
        c_lat = country.get("latitude")
        c_lng = country.get("longitude")

        if not sample_records["country"]:
            sample_records["country"] = {k: v for k, v in country.items() if k != "states"}

        # Validate country
        c_first, c_last, _ = clean_and_get_letters(c_name)
        if c_first and c_last:
            first_letter_counts[c_first] += 1
            last_letter_counts[c_last] += 1
        else:
            invalid_letter_count += 1

        if not validate_coordinates(c_lat, c_lng):
            missing_coords_count += 1

        states = country.get("states", [])
        total_states += len(states)

        for state in states:
            s_name = state.get("name", "").strip()
            s_lat = state.get("latitude")
            s_lng = state.get("longitude")

            if not sample_records["state"]:
                sample_records["state"] = {k: v for k, v in state.items() if k != "cities"}

            s_first, s_last, _ = clean_and_get_letters(s_name)
            if s_first and s_last:
                first_letter_counts[s_first] += 1
                last_letter_counts[s_last] += 1
            else:
                invalid_letter_count += 1

            if not validate_coordinates(s_lat, s_lng):
                missing_coords_count += 1

            cities = state.get("cities", [])
            total_cities += len(cities)
            country_place_counts[c_name] += len(cities)

            for city in cities:
                ci_name = city.get("name", "").strip()
                ci_lat = city.get("latitude")
                ci_lng = city.get("longitude")

                if not sample_records["city"]:
                    sample_records["city"] = city

                ci_first, ci_last, _ = clean_and_get_letters(ci_name)
                if ci_first and ci_last:
                    first_letter_counts[ci_first] += 1
                    last_letter_counts[ci_last] += 1
                else:
                    invalid_letter_count += 1

                if not validate_coordinates(ci_lat, ci_lng):
                    missing_coords_count += 1

    total_places = total_countries + total_states + total_cities

    # Write Markdown Report
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, 'w', encoding='utf-8') as rep:
        rep.write("# Atlas Kids - Dataset Inspection Report\n\n")
        rep.write(f"**Generated on:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        rep.write(f"**Source File:** `{json_path}` ({file_size_mb:.2f} MB)\n\n")

        rep.write("## 1. High-Level Summary\n\n")
        rep.write(f"- **Total Countries:** {total_countries:,}\n")
        rep.write(f"- **Total States/Regions:** {total_states:,}\n")
        rep.write(f"- **Total Cities/Towns:** {total_cities:,}\n")
        rep.write(f"- **Total Playable Places:** {total_places:,}\n")
        rep.write(f"- **Places Missing Valid Coordinates:** {missing_coords_count:,}\n")
        rep.write(f"- **Places with Unparseable Names:** {invalid_letter_count:,}\n\n")

        rep.write("## 2. Top 15 Countries by Place Count\n\n")
        rep.write("| Country | Total Cities in Dataset |\n")
        rep.write("| :--- | :--- |\n")
        for c, count in country_place_counts.most_common(15):
            rep.write(f"| {c} | {count:,} |\n")
        rep.write("\n")

        rep.write("## 3. The A–Z First Letter Matrix (Game Starting Letters)\n\n")
        rep.write("How many places start with each letter (A–Z):\n\n")
        rep.write("| Letter | Count | % of Dataset | Game Balance Assessment |\n")
        rep.write("| :---: | :---: | :---: | :--- |\n")
        all_letters = [chr(i) for i in range(ord('A'), ord('Z') + 1)]
        for letter in all_letters:
            cnt = first_letter_counts.get(letter, 0)
            pct = (cnt / total_places * 100) if total_places else 0
            if cnt == 0:
                verdict = "DEAD END (0 places)"
            elif cnt < 100:
                verdict = "CRITICAL BOTTLENECK (<100 places)"
            elif cnt < 1000:
                verdict = "LOW DENSITY"
            else:
                verdict = "HEALTHY"
            rep.write(f"| **{letter}** | {cnt:,} | {pct:.2f}% | {verdict} |\n")
        rep.write("\n")

        rep.write("## 4. The A–Z Last Letter Matrix (Game Trap Letters)\n\n")
        rep.write("Which letters places end on (the letter the opponent must play next):\n\n")
        rep.write("| Letter | End Count | Bottleneck Risk |\n")
        rep.write("| :---: | :---: | :--- |\n")
        for letter in all_letters:
            cnt = last_letter_counts.get(letter, 0)
            start_pool = first_letter_counts.get(letter, 0)
            ratio = (cnt / start_pool) if start_pool > 0 else 999.0
            risk = "HIGH RISK (High demand, low supply)" if ratio > 3.0 and start_pool < 500 else "NORMAL"
            rep.write(f"| **{letter}** | {cnt:,} | {risk} |\n")
        rep.write("\n")

        rep.write("## 5. Sample City Schema\n\n```json\n")
        rep.write(json.dumps(sample_records["city"], indent=2))
        rep.write("\n```\n")

    print(f"[✓] Inspection complete! Saved full report to: {report_path}")


if __name__ == "__main__":
    DATA_PATH = r"D:\dev\atlas-kids\data\countries+states+cities.json"
    REPORT_PATH = r"D:\dev\atlas-kids\reports\inspection_report.md"
    run_inspection(DATA_PATH, REPORT_PATH)
