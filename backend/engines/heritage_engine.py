import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_json(filename):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


heritage_sites = load_json("heritage_sites.json")
heritage_by_id = {site["id"]: site for site in heritage_sites}


def get_all_heritage_sites():
    result = []
    for site in heritage_sites:
        result.append(
            {
                "id": site["id"],
                "name": site["name"],
                "lat": site["lat"],
                "lng": site["lng"],
                "type": site["type"],
                "unesco": site["unesco"],
            }
        )
    return result


def get_heritage_site(site_id):
    return heritage_by_id.get(site_id, None)
