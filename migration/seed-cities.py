#!/usr/bin/env python3
"""
Fetches + processes the GeoNames US cities/ZIP dataset that backs the
Milestone 2 location-intelligence feature (cities/zips tables, migration
0005_location_intelligence.sql).

Data source: GeoNames (https://www.geonames.org), licensed CC BY 4.0.
Attribution required: "Contains information from GeoNames, which is made
available under the Creative Commons Attribution 4.0 International License."
This attribution lives in the site footer / a data-sources note — see
LAUNCH-REPORT.md for where it was added.

Why not Mapbox for storage: Mapbox's free Temporary Geocoding API forbids
persisting results. GeoNames is public-domain-friendly (CC BY, no such
restriction) and free, so it's the source of truth for STORED coordinates.
Mapbox is only ever called client-side for live autocomplete suggestions.

Usage:
    python3 migration/seed-cities.py
    # writes migration/geonames-cache/cities.json and zips.json

Then bulk-load into Supabase via REST (see migration/seed-cities-load.sh) —
run *after* migration 0005 has been applied (cities/zips tables must exist).
"""
import json
import re
import zipfile
import urllib.request
from pathlib import Path

CACHE_DIR = Path(__file__).parent / "geonames-cache"
CACHE_DIR.mkdir(exist_ok=True)

CITIES1000_URL = "https://download.geonames.org/export/dump/cities1000.zip"
ADMIN1_URL = "https://download.geonames.org/export/dump/admin1CodesASCII.txt"
US_ZIPS_URL = "https://download.geonames.org/export/zip/US.zip"


def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def fetch(url: str, dest: Path) -> Path:
    if not dest.exists():
        print(f"Downloading {url} -> {dest}")
        urllib.request.urlretrieve(url, dest)
    return dest


def build_cities():
    admin1_path = fetch(ADMIN1_URL, CACHE_DIR / "admin1.txt")
    admin1 = {}
    for line in admin1_path.read_text(encoding="utf-8").splitlines():
        parts = line.split("\t")
        if len(parts) >= 2 and parts[0].startswith("US."):
            admin1[parts[0]] = parts[1]

    cities_zip = fetch(CITIES1000_URL, CACHE_DIR / "cities1000.zip")
    best = {}
    with zipfile.ZipFile(cities_zip) as zf, zf.open("cities1000.txt") as f:
        for raw in f:
            parts = raw.decode("utf-8").rstrip("\n").split("\t")
            if len(parts) < 15:
                continue
            (_, name, asciiname, _, lat, lng, fclass, _fcode, country, _cc2,
             admin1code, *_rest, population) = (parts[0], parts[1], parts[2], parts[3],
                                                 parts[4], parts[5], parts[6], parts[7],
                                                 parts[8], parts[9], parts[10], parts[11],
                                                 parts[12], parts[13], parts[14])
            if country != "US" or fclass != "P" or len(admin1code) != 2:
                continue
            if f"US.{admin1code}" not in admin1:
                continue
            try:
                pop = int(population)
            except ValueError:
                pop = 0
            key = (asciiname, admin1code)
            if key not in best or pop > best[key]["population"]:
                best[key] = {
                    "name": asciiname,
                    "state_code": admin1code,
                    "lat": round(float(lat), 6),
                    "lng": round(float(lng), 6),
                    "population": pop,
                    "slug": slugify(asciiname),
                }

    rows = list(best.values())
    print(f"Cities: {len(rows)} (population > 1000, GeoNames cities1000)")
    (CACHE_DIR / "cities.json").write_text(json.dumps(rows))
    return rows


def build_zips():
    zips_zip = fetch(US_ZIPS_URL, CACHE_DIR / "us_zips.zip")
    seen = set()
    rows = []
    with zipfile.ZipFile(zips_zip) as zf, zf.open("US.txt") as f:
        for raw in f:
            parts = raw.decode("utf-8").rstrip("\n").split("\t")
            if len(parts) < 11:
                continue
            country, postal, place, _an1, admin_code1 = parts[0], parts[1], parts[2], parts[3], parts[4]
            lat, lng = parts[9], parts[10]
            if country != "US" or postal in seen:
                continue
            try:
                latf, lngf = float(lat), float(lng)
            except ValueError:
                continue
            seen.add(postal)
            rows.append({
                "zip": postal.strip(),
                "city": place.strip(),
                "state_code": admin_code1.strip(),
                "lat": latf,
                "lng": lngf,
            })
    print(f"ZIPs: {len(rows)}")
    (CACHE_DIR / "zips.json").write_text(json.dumps(rows))
    return rows


if __name__ == "__main__":
    build_cities()
    build_zips()
    print("Done. Next: ./migration/seed-cities-load.sh to bulk-insert via Supabase REST.")
