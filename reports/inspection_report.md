# Atlas Kids - Dataset Inspection Report

**Generated on:** 2026-10-22 04:14:50
**Source File:** `D:\dev\atlas-kids\data\countries+states+cities.json` (50.45 MB)

## 1. High-Level Summary

- **Total Countries:** 250
- **Total States/Regions:** 5,327
- **Total Cities/Towns:** 152,375
- **Total Playable Places:** 157,952
- **Places Missing Valid Coordinates:** 4
- **Places with Unparseable Names:** 9

## 2. Top 15 Countries by Place Count

| Country | Total Cities in Dataset |
| :--- | :--- |
| United States | 17,317 |
| France | 10,429 |
| Italy | 10,216 |
| Mexico | 9,308 |
| Spain | 8,301 |
| Romania | 7,948 |
| Germany | 7,107 |
| Brazil | 5,628 |
| Russia | 5,269 |
| Philippines | 4,374 |
| India | 4,335 |
| Australia | 4,145 |
| China | 4,104 |
| United Kingdom | 3,747 |
| Poland | 2,810 |

## 3. The A–Z First Letter Matrix (Game Starting Letters)

How many places start with each letter (A–Z):

| Letter | Count | % of Dataset | Game Balance Assessment |
| :---: | :---: | :---: | :--- |
| **A** | 8,947 | 5.66% | HEALTHY |
| **B** | 12,562 | 7.95% | HEALTHY |
| **C** | 13,445 | 8.51% | HEALTHY |
| **D** | 4,970 | 3.15% | HEALTHY |
| **E** | 4,257 | 2.70% | HEALTHY |
| **F** | 3,722 | 2.36% | HEALTHY |
| **G** | 6,274 | 3.97% | HEALTHY |
| **H** | 5,195 | 3.29% | HEALTHY |
| **I** | 2,354 | 1.49% | HEALTHY |
| **J** | 2,336 | 1.48% | HEALTHY |
| **K** | 6,473 | 4.10% | HEALTHY |
| **L** | 9,269 | 5.87% | HEALTHY |
| **M** | 11,907 | 7.54% | HEALTHY |
| **N** | 5,427 | 3.44% | HEALTHY |
| **O** | 3,569 | 2.26% | HEALTHY |
| **P** | 10,189 | 6.45% | HEALTHY |
| **Q** | 823 | 0.52% | LOW DENSITY |
| **R** | 5,468 | 3.46% | HEALTHY |
| **S** | 19,133 | 12.11% | HEALTHY |
| **T** | 7,253 | 4.59% | HEALTHY |
| **U** | 1,478 | 0.94% | HEALTHY |
| **V** | 5,481 | 3.47% | HEALTHY |
| **W** | 3,816 | 2.42% | HEALTHY |
| **X** | 489 | 0.31% | LOW DENSITY |
| **Y** | 1,302 | 0.82% | HEALTHY |
| **Z** | 1,804 | 1.14% | HEALTHY |

## 4. The A–Z Last Letter Matrix (Game Trap Letters)

Which letters places end on (the letter the opponent must play next):

| Letter | End Count | Bottleneck Risk |
| :---: | :---: | :--- |
| **A** | 27,906 | NORMAL |
| **B** | 331 | NORMAL |
| **C** | 1,687 | NORMAL |
| **D** | 4,726 | NORMAL |
| **E** | 18,318 | NORMAL |
| **F** | 1,094 | NORMAL |
| **G** | 4,999 | NORMAL |
| **H** | 3,961 | NORMAL |
| **I** | 10,848 | NORMAL |
| **J** | 328 | NORMAL |
| **K** | 3,451 | NORMAL |
| **L** | 4,959 | NORMAL |
| **M** | 2,720 | NORMAL |
| **N** | 18,213 | NORMAL |
| **O** | 15,916 | NORMAL |
| **P** | 774 | NORMAL |
| **Q** | 127 | NORMAL |
| **R** | 5,999 | NORMAL |
| **S** | 12,907 | NORMAL |
| **T** | 5,363 | NORMAL |
| **U** | 3,981 | NORMAL |
| **V** | 565 | NORMAL |
| **W** | 832 | NORMAL |
| **X** | 581 | NORMAL |
| **Y** | 5,651 | NORMAL |
| **Z** | 1,706 | NORMAL |

## 5. Sample City Schema

```json
{
  "id": 52,
  "name": "Ashk\u0101sham",
  "county_id": null,
  "latitude": "36.68333000",
  "longitude": "71.53333000",
  "timezone": "Asia/Kabul"
}
```

.
.
.
.

after import_places.py
[✓] Data inserted successfully in 148.74 seconds!
[*] Creating database indexes for sub-millisecond AI answers...

============================================================
📊 FINAL INGESTION SUMMARY:
============================================================
  • Tier 1 (Countries): 250 places
  • Tier 2 (Capitals): 218 places
  • Tier 3 (States): 5,327 places
  • Tier 4 (Cities): 152,148 places
  ⭐ Total Places in Database: 157,943
============================================================

[🎉] Done! Entire pipeline completed in 161.64 seconds.