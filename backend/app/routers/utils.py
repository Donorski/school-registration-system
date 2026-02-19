"""Utility endpoints — address lookups and strand listings."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/utils", tags=["Utilities"])

# Philippine address data (representative subset for the dropdown system)
PROVINCES_DATA: dict[str, dict[str, list[str]]] = {
    "Metro Manila": {
        "Manila": ["Ermita", "Intramuros", "Malate", "Paco", "Pandacan", "Sampaloc", "San Miguel", "Santa Ana", "Tondo"],
        "Quezon City": ["Bagong Pag-asa", "Batasan Hills", "Commonwealth", "Diliman", "Fairview", "Holy Spirit", "Novaliches", "Project 6", "Tandang Sora"],
        "Makati": ["Bel-Air", "Guadalupe Nuevo", "Guadalupe Viejo", "Magallanes", "Poblacion", "San Antonio", "San Lorenzo"],
        "Pasig": ["Bagong Ilog", "Kapitolyo", "Manggahan", "Ortigas Center", "Rosario", "San Miguel", "Santolan"],
        "Taguig": ["Bagumbayan", "Bonifacio Global City", "Fort Bonifacio", "Lower Bicutan", "Upper Bicutan", "Western Bicutan"],
        "Caloocan": ["Bagong Barrio", "Camarin", "Deparo", "Grace Park", "Maypajo", "Sangandaan"],
        "Las Piñas": ["Almanza", "BF Resort", "Pamplona", "Pilar", "Pulang Lupa", "Talon"],
        "Marikina": ["Concepcion", "Fortune", "Industrial Valley", "Malanday", "Nangka", "Parang", "Tumana"],
        "Muntinlupa": ["Alabang", "Bayanan", "Cupang", "Poblacion", "Putatan", "Sucat", "Tunasan"],
        "Parañaque": ["Baclaran", "BF Homes", "Don Bosco", "La Huerta", "San Dionisio", "Sucat"],
    },
    "Cavite": {
        "Bacoor": ["Habay", "Ligas", "Molino", "Niog", "Panapaan", "Queens Row", "Real"],
        "Dasmariñas": ["Burol", "Langkaan", "Paliparan", "Sabang", "Salawag", "Salitran", "Zone I"],
        "Imus": ["Alapan", "Anabu", "Bayan Luma", "Buhay na Tubig", "Malagasang", "Medicion", "Tanzang Luma"],
        "General Trias": ["Arnaldo", "Bacao", "Javalera", "Manggahan", "Pasong Camachile", "San Francisco", "Santiago"],
        "Cavite City": ["Barangay 1", "Barangay 22", "Caridad", "Dalahican", "San Antonio", "Santa Cruz"],
    },
    "Laguna": {
        "Santa Rosa": ["Balibago", "Dita", "Don Jose", "Macabling", "Pooc", "Tagapo"],
        "Biñan": ["Canlalay", "De La Paz", "Langkiwa", "Malaban", "San Antonio", "San Francisco", "Zapote"],
        "San Pedro": ["Calendola", "Chrysanthemum", "Landayan", "Laram", "Magsaysay", "San Antonio", "United Bayanihan"],
        "Calamba": ["Bagong Kalsada", "Canlubang", "Parian", "Real", "Saimsim", "Sucol"],
        "Los Baños": ["Anos", "Bagong Silang", "Batong Malake", "Bayog", "Lalakay", "Maahas", "Mayondon"],
    },
    "Bulacan": {
        "Malolos": ["Atlag", "Bagna", "Balayong", "Caliligawan", "Ligas", "Longos", "Mojon", "Santol"],
        "Meycauayan": ["Bagbaguin", "Bancal", "Calvario", "Hulo", "Lawa", "Malhacan", "Perez"],
        "San Jose del Monte": ["Citrus", "Dulong Bayan", "Fatima", "Francisco Homes", "Graceville", "Kaypian", "Muzon"],
        "Marilao": ["Abangan Norte", "Abangan Sur", "Ibayo", "Lambakin", "Lias", "Patubig", "Prenza"],
    },
    "Cebu": {
        "Cebu City": ["Apas", "Banilad", "Capitol Site", "Guadalupe", "Labangon", "Lahug", "Mabolo", "Talamban"],
        "Mandaue": ["Basak", "Cabancalan", "Casili", "Centro", "Jagobiao", "Looc", "Maguikay", "Tipolo"],
        "Lapu-Lapu": ["Agus", "Basak", "Gun-ob", "Mactan", "Maribago", "Pajo", "Pusok"],
        "Talisay": ["Bulacao", "Lawaan", "Linao", "Maghaway", "San Roque", "Tabunoc", "Tangke"],
    },
    "Davao del Sur": {
        "Davao City": ["Agdao", "Buhangin", "Catalunan Grande", "Ma-a", "Matina", "Panacan", "Poblacion", "Talomo", "Toril"],
        "Digos": ["Aplaya", "Dulangan", "Kapatagan", "San Jose", "San Miguel", "Zone 1", "Zone 2", "Zone 3"],
    },
    "Pampanga": {
        "San Fernando": ["Dolores", "Juliana", "Lara", "Magliman", "San Agustin", "San Jose", "Santo Niño", "Telabastagan"],
        "Angeles": ["Anunas", "Balibago", "Cutcut", "Malabanias", "Mining", "Pandan", "Pulung Maragul", "Sapangbato"],
        "Mabalacat": ["Atlu-Bola", "Bical", "Bundagul", "Cacutud", "Calumpang", "Dau", "Mabiga", "San Francisco"],
    },
    "Batangas": {
        "Batangas City": ["Alangilan", "Balagtas", "Bolbok", "Cuta", "Kumintang Ibaba", "Pallocan", "Poblacion", "Santa Rita"],
        "Lipa": ["Balintawak", "Barangay 1", "Lodlod", "Marawoy", "Mataas na Lupa", "San Sebastian", "Tambo", "Tipakan"],
        "Tanauan": ["Bagbag", "Boot", "Darasa", "Gonzales", "Janopol", "Luyos", "Natatas", "Wawa"],
    },
}

STRANDS = [
    {"code": "STEM", "name": "Science, Technology, Engineering, and Mathematics"},
    {"code": "ABM", "name": "Accountancy, Business, and Management"},
    {"code": "HUMSS", "name": "Humanities and Social Sciences"},
    {"code": "GAS", "name": "General Academic Strand"},
    {"code": "TVL-ICT", "name": "Technical-Vocational-Livelihood - ICT"},
    {"code": "TVL-HE", "name": "Technical-Vocational-Livelihood - Home Economics"},
    {"code": "TVL-IA", "name": "Technical-Vocational-Livelihood - Industrial Arts"},
    {"code": "TVL-AFA", "name": "Technical-Vocational-Livelihood - Agri-Fishery Arts"},
    {"code": "SPORTS", "name": "Sports Track"},
    {"code": "ARTS", "name": "Arts and Design Track"},
]


@router.get("/provinces")
def get_provinces():
    """List all available provinces."""
    return {"provinces": sorted(PROVINCES_DATA.keys())}


@router.get("/cities/{province}")
def get_cities(province: str):
    """List cities/municipalities for a given province."""
    cities = PROVINCES_DATA.get(province)
    if cities is None:
        return {"province": province, "cities": []}
    return {"province": province, "cities": sorted(cities.keys())}


@router.get("/barangays/{city}")
def get_barangays(city: str):
    """List barangays for a given city/municipality."""
    for province_cities in PROVINCES_DATA.values():
        if city in province_cities:
            return {"city": city, "barangays": sorted(province_cities[city])}
    return {"city": city, "barangays": []}


@router.get("/strands")
def get_strands():
    """List all available Senior High School strands."""
    return {"strands": STRANDS}
