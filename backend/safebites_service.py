import os
import json
import logging
import requests
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

# User-Agent required by OpenFoodFacts terms of service
OPENFOODFACTS_API_KEY = os.getenv("OPENFOODFACTS_API_KEY") or os.getenv("OPEN_FOOD_FACTS_API_KEY") or os.getenv("OPENFOODFACTS_KEY")
OPENFOODFACTS_HEADERS = {
    "User-Agent": "MediCore-SafeBites/1.0 (healthcare-platform; contact: medical@medicore.org)"
}
if OPENFOODFACTS_API_KEY:
    OPENFOODFACTS_HEADERS["Authorization"] = f"Bearer {OPENFOODFACTS_API_KEY}"

# Known Database of Dangerous / Controversial Food Ingredients & Additives
KNOWN_ADDITIVES_DB = {
    "e171": {
        "name": "Titanium Dioxide (E171)",
        "hazard_level": "High",
        "health_risks": "Genotoxicity (DNA damage), cellular oxidative stress, intestinal inflammation, accumulation in organs.",
        "banned_in": ["European Union (Banned in 2022)", "Switzerland", "Yemen"],
        "why_used": "Nanoparticle white pigment used to brighten candies, pastries, sauces, and frosting."
    },
    "e129": {
        "name": "Allura Red AC / Red 40 (E129)",
        "hazard_level": "High",
        "health_risks": "Hyperactivity and ADHD in children, allergic reactions, colitis flare-ups, bowel inflammation.",
        "banned_in": ["Norway", "Austria", "European Union (Warning mandatory: 'May affect activity/attention in children')", "California Schools"],
        "why_used": "Synthetic petroleum-based dye for artificial bright red coloring."
    },
    "e102": {
        "name": "Tartrazine / Yellow 5 (E102)",
        "hazard_level": "High",
        "health_risks": "Severe allergic reactions, asthma exacerbation, neurobehavioral symptoms, potential chromosome damage.",
        "banned_in": ["Norway", "Austria", "European Union (Mandatory health warning)", "California Schools"],
        "why_used": "Coal-tar derived artificial yellow dye in chips, sodas, and candies."
    },
    "e110": {
        "name": "Sunset Yellow FCF / Yellow 6 (E110)",
        "hazard_level": "High",
        "health_risks": "Kidney tumors in animal studies, severe hives, hyperactivity in children, gastric upset.",
        "banned_in": ["Norway", "Finland", "European Union (Requires warning label)", "California Schools"],
        "why_used": "Synthetic azo dye used in orange sodas, cheeses, and confectionery."
    },
    "e133": {
        "name": "Brilliant Blue FCF / Blue 1 (E133)",
        "hazard_level": "Moderate",
        "health_risks": "Hypersensitivity, potential neurotoxicity at high intake, crosses blood-brain barrier.",
        "banned_in": ["France (previously)", "Switzerland", "Restricted in EU"],
        "why_used": "Synthetic blue dye used in sports drinks, baked goods, and syrups."
    },
    "e924": {
        "name": "Potassium Bromate (E924 / E924a)",
        "hazard_level": "Critical",
        "health_risks": "Category 2B possible human carcinogen; causes renal cell and thyroid tumors in animal studies.",
        "banned_in": ["European Union", "United Kingdom", "Canada", "China", "India", "Brazil", "California"],
        "why_used": "Flour bleaching and dough strengthening agent for commercial sandwich bread."
    },
    "e320": {
        "name": "BHA (Butylated Hydroxyanisole / E320)",
        "hazard_level": "High",
        "health_risks": "Anticipated human carcinogen (NTP), endocrine disruptor, thyroid hormone disruption, liver damage.",
        "banned_in": ["European Union (restricted/banned in cosmetics/food)", "Japan", "California (Prop 65 list)"],
        "why_used": "Synthetic preservative to prevent fats and oils from turning rancid."
    },
    "e321": {
        "name": "BHT (Butylated Hydroxytoluene / E321)",
        "hazard_level": "Moderate",
        "health_risks": "Endocrine disruption, liver enlargement, mimicry of estrogen hormones.",
        "banned_in": ["United Kingdom (infant foods)", "Japan (restricted)", "Parts of EU"],
        "why_used": "Petroleum-derived antioxidant preservative in cereals, snack bars, and oils."
    },
    "e250": {
        "name": "Sodium Nitrite (E250)",
        "hazard_level": "High",
        "health_risks": "Forms carcinogenic nitrosamines when cooked at high heat; strongly correlated with colorectal cancer.",
        "banned_in": ["Restricted strictly in EU and WHO guidelines; strictly capped in Denmark"],
        "why_used": "Curing agent in hot dogs, bacon, and processed meats for pink color and botulism prevention."
    },
    "e951": {
        "name": "Aspartame (E951)",
        "hazard_level": "Moderate",
        "health_risks": "Classified by WHO/IARC as Group 2B 'Possibly Carcinogenic to Humans'; migrains, gut microbiome disturbance.",
        "banned_in": ["Restricted in pediatric formulations; banned for individuals with Phenylketonuria (PKU)"],
        "why_used": "High-intensity artificial sweetener in 'diet' sodas and sugar-free snacks."
    },
    "e927a": {
        "name": "Azodicarbonamide / ADA (E927a)",
        "hazard_level": "Critical",
        "health_risks": "Breaks down into semicarbazide (carcinogen); respiratory sensitizer causing occupational asthma.",
        "banned_in": ["European Union", "United Kingdom", "Australia", "Singapore (15-year jail / $450k fine)"],
        "why_used": "Chemical foaming agent and dough conditioner ('yoga mat chemical')."
    },
    "bvo": {
        "name": "Brominated Vegetable Oil (BVO)",
        "hazard_level": "Critical",
        "health_risks": "Bioaccumulates bromine in fat tissues; causes thyroid dysfunction, neurological impairment, reproductive toxicity.",
        "banned_in": ["European Union", "United Kingdom", "Japan", "India", "USA (FDA banned effective 2024)"],
        "why_used": "Emulsifier to prevent citrus flavoring oils from floating in sodas."
    },
    "propylparaben": {
        "name": "Propylparaben (E216)",
        "hazard_level": "High",
        "health_risks": "Endocrine disruptor; mimics estrogen, decreases sperm counts, linked to accelerated breast cancer cell growth.",
        "banned_in": ["European Union (banned in food since 2006)", "California (Food Safety Act 2027)"],
        "why_used": "Preservative used in tortillas, muffins, and cake icings."
    },
    "red3": {
        "name": "Red 3 / Erythrosine (E127)",
        "hazard_level": "High",
        "health_risks": "Recognized animal carcinogen (thyroid tumors); FDA banned in cosmetics in 1990; food ban enacted in California.",
        "banned_in": ["European Union (allowed only in cocktail cherries)", "Australia (restricted)", "California"],
        "why_used": "Bright cherry red food coloring in seasonal candies and baked goods."
    },
    "trans_fats": {
        "name": "Partially Hydrogenated Oils / Trans Fats",
        "hazard_level": "Critical",
        "health_risks": "Dramatically increases LDL bad cholesterol while lowering HDL good cholesterol; major driver of coronary artery disease.",
        "banned_in": ["United States (FDA GRAS revoked)", "European Union (<2g limit)", "Canada", "Denmark"],
        "why_used": "Artificially hydrogenated vegetable fats for long shelf-life in deep frying and pastries."
    },
    "hfcs": {
        "name": "High Fructose Corn Syrup (HFCS / Glucose-Fructose)",
        "hazard_level": "Moderate",
        "health_risks": "Metabolized exclusively by liver; fuels non-alcoholic fatty liver disease (NAFLD), visceral adiposity, leptin resistance.",
        "banned_in": ["European Union (Restricted by agricultural quotas to ~5% of sweeteners)"],
        "why_used": "Cheap liquid sweetener made from corn starch."
    },
    "e621": {
        "name": "Monosodium Glutamate / MSG (E621)",
        "hazard_level": "Moderate",
        "health_risks": "Excitotoxicity symptoms in sensitive individuals, migraines, asthma trigger, appetite dysregulation.",
        "banned_in": ["European Union (Banned in food for infants and young children)", "Australia (Mandatory labeling)"],
        "why_used": "Synthetic savory flavor enhancer (umami) in chips, seasonings, and processed meals."
    },
    "e211": {
        "name": "Sodium Benzoate (E211)",
        "hazard_level": "High",
        "health_risks": "Combines with Vitamin C (ascorbic acid) to form Benzene, a known Category 1 human carcinogen; triggers hyperactivity.",
        "banned_in": ["Restricted strictly in EU and UK drinks", "European Union (Warning mandatory for child hyperactivity)"],
        "why_used": "Chemical preservative against mold and yeast in acidic beverages and jams."
    },
    "e407": {
        "name": "Carrageenan (E407)",
        "hazard_level": "Moderate",
        "health_risks": "Severe gastrointestinal inflammation, intestinal ulcerations, glucose intolerance; degraded carrageenan is a known carcinogen.",
        "banned_in": ["European Union (Banned in infant formula and baby foods)"],
        "why_used": "Thickener and stabilizer extracted from red seaweed used in dairy and plant milks."
    },
    "e338": {
        "name": "Phosphoric Acid (E338)",
        "hazard_level": "Moderate",
        "health_risks": "Leaches calcium from bones increasing osteoporosis risk, accelerates chronic kidney disease progression, erodes dental enamel.",
        "banned_in": ["Restricted in EU foods to max limits; strongly cautioned by nephrology boards"],
        "why_used": "Sharp acidulant and preservative in dark sodas (colas) to impart tangy bite."
    },
    "e955": {
        "name": "Sucralose / Splenda (E955)",
        "hazard_level": "Moderate",
        "health_risks": "Disrupts healthy gut microbiome diversity by up to 50%; when heated, forms toxic chloropropanols; impairs insulin response.",
        "banned_in": ["Strict acceptable daily intake limits in WHO and EFSA guidelines"],
        "why_used": "Chlorinated artificial sweetener 600x sweeter than table sugar."
    }
}

SAMPLE_PRODUCTS = [
    {
        "barcode": "7622210449283",
        "name": "Oreo Original Sandwich Cookies",
        "brand": "Mondelez",
        "category": "Biscuits & Cakes",
        "highlight": "Why 'Creme' instead of 'Cream'?",
        "topic": "creme_vs_cream",
        "image": "https://images.openfoodfacts.org/images/products/762/221/044/9283/front_en.198.400.jpg"
    },
    {
        "barcode": "0013000006408",
        "name": "Heinz Tomato Ketchup",
        "brand": "Kraft Heinz",
        "category": "Sauces & Condiments",
        "highlight": "",
        "topic": "ketchup_sugar",
        "image": "https://images.openfoodfacts.org/images/products/001/300/000/6408/front_en.188.400.jpg"
    },
    {
        "barcode": "8906017290040",
        "name": "Bisleri Packaged Drinking Water",
        "brand": "Bisleri",
        "category": "Packaged Water",
        "highlight": "",
        "topic": "water_mineral_vs_packaged",
        "image": "https://images.openfoodfacts.org/images/products/890/601/729/0040/front_en.12.400.jpg"
    },
    {
        "barcode": "8901262010053",
        "name": "Amul Butter",
        "brand": "Amul",
        "category": "Dairy & Spreads",
        "highlight": "Pure Churned Butterfat vs Palm Oil Margarine",
        "topic": "butter_vs_spread",
        "image": "https://images.openfoodfacts.org/images/products/890/126/201/0053/front_en.6.400.jpg"
    },
    {
        "barcode": "8901030018152",
        "name": "Kwality Wall's Chocolate Tub",
        "brand": "Hindustan Unilever",
        "category": "Ice Cream & Frozen Desserts",
        "highlight": "Real Dairy Ice Cream vs Vegetable Oil Frozen Dessert",
        "topic": "icecream_vs_frozendessert",
        "image": "https://images.openfoodfacts.org/images/products/890/103/001/8152/front_en.3.400.jpg"
    },
    {
        "barcode": "0028400040112",
        "name": "Doritos Nacho Cheese",
        "brand": "Frito-Lay",
        "category": "Snacks & Chips",
        "highlight": "Red 40, Yellow 5, Yellow 6 & MSG",
        "topic": "chips_msg_dyes",
        "image": "https://images.openfoodfacts.org/images/products/002/840/004/0112/front_en.164.400.jpg"
    },
    {
        "barcode": "3017620422003",
        "name": "Nutella Hazelnut Spread",
        "brand": "Ferrero",
        "category": "Spreads & Sweets",
        "highlight": "55% Sugar + 23% Palm Oil vs 13% Hazelnuts",
        "topic": "nutella_sugar",
        "image": "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.551.400.jpg"
    },
    {
        "barcode": "5449000000996",
        "name": "Coca-Cola Original",
        "brand": "The Coca-Cola Company",
        "category": "Beverages",
        "highlight": "Phosphoric Acid (E338) & 10 Teaspoons of Sugar",
        "topic": "soda_sugar_acid",
        "image": "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.716.400.jpg"
    }
]

# ─── Curated Food Myth Busters & Interactive Trivia Database ──────────────────

FOOD_MYTHS_AND_TRIVIA_DB = {
    "creme_vs_cream": {
        "match_keywords": ["oreo", "biscuit", "cookie", "creme", "wafer", "cream biscuit"],
        "cards": [
            {
                "id": 1,
                "badge": "Legal Labeling Secret",
                "question": "Why does the box say 'CREME' instead of 'CREAM'?",
                "options": [
                    "It is the French spelling used for gourmet marketing",
                    "Food law strictly forbids 'Cream' because it contains 0% real dairy milkfat",
                    "The word 'Cream' was already patented by another bakery",
                    "It indicates the filling is certified organic milk"
                ],
                "correct_index": 1,
                "busted_myth": "There is ZERO dairy cream in the filling—it is pure vegetable shortening and sugar!",
                "explanation": "Under FDA and international food safety laws, a product can only be legally labeled 'Cream' if it contains at least 18% real dairy milkfat. Because Oreo filling is made of hydrogenated vegetable oil and sugar with 0% dairy, the law prohibits them from writing 'Cream'!"
            },
            {
                "id": 2,
                "badge": "Ingredient Mystery",
                "question": "How are the dark chocolate cookie wafers made so uniquely pitch black?",
                "options": [
                    "From 100% single-origin dark cocoa beans",
                    "Heavily alkalized Dutch-processed cocoa treated with potassium carbonate (stripping 90% of natural antioxidants)",
                    "Synthetic coal-tar black food dye (E151)"
                ],
                "correct_index": 1,
                "busted_myth": "The color is not natural dark chocolate—it is chemically alkalized to alter pH.",
                "explanation": "The cookies use heavily alkalized (Dutch-processed) cocoa, which chemically alters the pH and destroys up to 90% of the natural healthy flavanols and antioxidants in cocoa to achieve that extreme pitch-black color."
            }
        ]
    },
    "ketchup_sugar": {
        "match_keywords": ["ketchup", "catsup", "tomato sauce", "heinz", "sauce"],
        "cards": [
            {
                "id": 1,
                "badge": "Hidden Sugar Alert",
                "question": "In commercial tomato ketchup, what is the largest ingredient group after tomato concentrate?",
                "options": [
                    "Purified mountain water & vinegar",
                    "High Fructose Corn Syrup & Added Sugars (approx. 25-30% of the entire bottle)",
                    "Fresh herbs, black pepper, and olive oil",
                    "Minced garlic and onion puree"
                ],
                "correct_index": 1,
                "busted_myth": "Marketed as a savory vegetable condiment, but chemically closer to candy syrup!",
                "explanation": "One single tablespoon of commercial ketchup contains 4 grams of sugar—more than a typical chocolate chip cookie! Added sugars and corn syrups often make up nearly 1/3 of the entire bottle."
            }
        ]
    },
    "water_mineral_vs_packaged": {
        "match_keywords": ["water", "packaged drinking water", "mineral water", "bisleri", "aquafina", "kinley", "dasani", "water bottle"],
        "cards": [
            {
                "id": 1,
                "badge": "Water Label Deception",
                "question": "Do you know the difference between 'Natural Mineral Water' and 'Packaged Drinking Water'?",
                "options": [
                    "There is no difference; it is purely marketing packaging",
                    "Natural Mineral Water comes from protected underground springs with natural minerals; Packaged Water is treated municipal tap water stripped by RO with added synthetic salts",
                    "Packaged drinking water is naturally filtered through glacier ice"
                ],
                "correct_index": 1,
                "busted_myth": "Most bottled water in stores is merely filtered municipal tap water!",
                "explanation": "'Natural Mineral Water' (e.g. Evian, Himalayan) originates from protected underground aquifers with natural geological minerals. 'Packaged Drinking Water' (e.g. Aquafina, Kinley, Bisleri) is municipal tap/borewell water stripped bare by reverse osmosis, with synthetic chemical salts (magnesium sulphate, potassium bicarbonate) added back for taste!"
            }
        ]
    },
    "butter_vs_spread": {
        "match_keywords": ["butter", "spread", "margarine", "nutralite", "table spread", "bread spread"],
        "cards": [
            {
                "id": 1,
                "badge": "Dairy vs Industrial Oil",
                "question": "What is the fundamental difference between real Butter and 'Bread Spread' / Margarine?",
                "options": [
                    "Bread spread has more natural dairy vitamins than butter",
                    "Butter is churned 80%+ pure dairy milkfat; Bread Spread is made from refined, hydrogenated vegetable/palm oils and artificial butter flavors",
                    "Bread spread is raw unprocessed butter"
                ],
                "correct_index": 1,
                "busted_myth": "'Bread spread' is NOT a dairy product—it is an emulsion of industrial vegetable oils!",
                "explanation": "By legal definition, Butter must contain at least 80% butterfat churned directly from animal milk. 'Table Spreads' and margarines substitute real dairy with cheap refined palm or soybean oils, artificial yellow food dyes (Annatto/Carotene), and diacetyl (artificial butter flavoring)!"
            }
        ]
    },
    "icecream_vs_frozendessert": {
        "match_keywords": ["ice cream", "frozen dessert", "kwality", "wall", "cornetto", "sundae", "cone"],
        "cards": [
            {
                "id": 1,
                "badge": "Milkfat vs Palm Oil",
                "question": "Why do many popular brand tubs say 'FROZEN DESSERT' instead of 'ICE CREAM'?",
                "options": [
                    "Frozen desserts are chilled to a lower temperature",
                    "Food laws require Ice Cream to use dairy milkfat; 'Frozen Desserts' replace milkfat with cheaper vegetable/palm oil",
                    "Frozen desserts contain 0% sugar"
                ],
                "correct_index": 1,
                "busted_myth": "That creamy tub in your freezer might contain zero dairy butterfat!",
                "explanation": "Under food regulations, a product can only be called 'Ice Cream' if it contains a minimum of 10% pure dairy milkfat. Companies use 'Frozen Dessert' when they swap out expensive dairy cream for cheap hydrogenated vegetable oil or palm oil to drastically increase profit margins!"
            }
        ]
    },
    "chips_msg_dyes": {
        "match_keywords": ["doritos", "chips", "cheetos", "lays", "crisps", "nacho", "potato chip"],
        "cards": [
            {
                "id": 1,
                "badge": "Sensory Manipulation",
                "question": "Why do flavored chips like Doritos trigger intense, uncontrollable cravings?",
                "options": [
                    "They contain natural whole-grain endorphins",
                    "Formulated with the 'Bliss Point' ratio of salt, fat, and MSG (Monosodium Glutamate) to override satiety cues",
                    "They have high dietary fiber content"
                ],
                "correct_index": 1,
                "busted_myth": "Cravings are engineered in food science labs, not accidental!",
                "explanation": "Food scientists engineer chips to reach the 'Bliss Point'—a hyper-palatable balance of salt, processed fat, and free glutamate (MSG) that triggers dopamine release while melting rapidly on the tongue (vanishing caloric density), fooling your brain into thinking you haven't consumed calories!"
            }
        ]
    },
    "nutella_sugar": {
        "match_keywords": ["nutella", "hazelnut", "chocolate spread"],
        "cards": [
            {
                "id": 1,
                "badge": "Nut Deception",
                "question": "In a jar of Nutella, what percentage of the jar is actually Hazelnuts vs Sugar and Palm Oil?",
                "options": [
                    "70% Hazelnuts, 30% Cocoa",
                    "Only 13% Hazelnuts; over 55% is pure refined white sugar + 23% refined palm oil",
                    "50% Hazelnuts, 50% Skim Milk"
                ],
                "correct_index": 1,
                "busted_myth": "Nutella is marketed with healthy hazelnuts and milk, but is predominantly sugar and palm oil.",
                "explanation": "In a typical jar of Nutella, hazelnuts make up just 13% of the content. More than half the jar (56.8%) is pure refined sugar, followed by modified palm oil. Two tablespoons contain 21 grams of sugar!"
            }
        ]
    }
}


def build_dynamic_food_flash_quiz(product: Dict[str, Any], detected_dangerous: Optional[List[Dict[str, Any]]] = None, query_text: str = "") -> List[Dict[str, Any]]:
    """
    Generates dynamic, eye-opening flashcards / trivia questions tailored specifically to the scanned product.
    If the product matches iconic food categories, uses curated deep-dive myth busters.
    Otherwise, dynamically synthesizes questions based on the product's actual detected additives,
    sugar content, and NOVA processing level.
    """
    prod_name = product.get("product_name") or "This Product"
    category = product.get("categories") or ""
    ingredients_text = product.get("ingredients_text") or ""
    nutriments = product.get("nutriments_100g") or {}
    sugars_100g = nutriments.get("sugars") or 0
    fat_100g = nutriments.get("fat") or 0
    nova_group = product.get("nova_group") or 3

    search_corpus = f"{prod_name} {category} {ingredients_text} {query_text}".lower()

    # 1. Match curated forensic topics first if applicable
    for topic_key, topic_data in FOOD_MYTHS_AND_TRIVIA_DB.items():
        for kw in topic_data["match_keywords"]:
            if kw in search_corpus:
                return topic_data["cards"][:2]

    cards: List[Dict[str, Any]] = []

    # 2. Dynamic generation based on detected dangerous additives
    if detected_dangerous and len(detected_dangerous) > 0:
        top_additive = detected_dangerous[0]
        additive_name = top_additive.get("name", "Synthetic Additive")
        banned_locations = ", ".join(top_additive.get("banned_in", ["the European Union"])[:2])
        health_risk = top_additive.get("health_risks", "potential physiological harm")

        cards.append({
            "id": 1,
            "badge": "Chemical Additive Alert",
            "question": f"SafeBites detected '{additive_name}' in {prod_name}. Why is this chemical strictly banned or flagged with warnings in {banned_locations}?",
            "options": [
                f"Documented links to {health_risk.split(';')[0].lower()} and cellular toxicity",
                "It is too expensive for foreign food manufacturers to import",
                "It causes food packages to degrade faster during ocean shipping",
                "Foreign customs laws favor locally grown spices instead"
            ],
            "correct_index": 0,
            "busted_myth": f"{additive_name} is prohibited or heavily restricted abroad, yet still permitted in domestic commercial products!",
            "explanation": f"Regulatory agencies like EFSA (Europe) and Japan's MHLW have banned or mandated black-box health warnings on {additive_name} due to research linking it to: {health_risk}."
        })

    # 3. Dynamic generation based on sugar content
    try:
        sugar_val = float(sugars_100g)
    except (ValueError, TypeError):
        sugar_val = 0.0

    if sugar_val >= 12.0:
        spoons = round(sugar_val / 4.2, 1)
        cards.append({
            "id": len(cards) + 1,
            "badge": "Hidden Sugar Forensics",
            "question": f"In a 100g portion of {prod_name}, how many teaspoons of sugar are packed into the formulation?",
            "options": [
                f"Approximately {max(1, round(spoons * 0.3))} teaspoon",
                f"About {spoons} teaspoons of sugar (~{int(sugar_val)}g pure sugar)",
                f"Only {max(1, round(spoons * 0.1))} teaspoon (mostly natural fruit)",
                "Zero added sugars"
            ],
            "correct_index": 1,
            "busted_myth": f"Contains roughly {spoons} teaspoons of sugar per 100g, rivaling desserts!",
            "explanation": f"With {sugar_val}g of sugar per 100g, consuming this item delivers {spoons} teaspoons of fast-absorbing sugars. The World Health Organization recommends limiting free sugars to under 6 teaspoons (25g) per day for an adult."
        })
    elif "palm" in ingredients_text.lower() or "hydrogenated" in ingredients_text.lower():
        cards.append({
            "id": len(cards) + 1,
            "badge": "Industrial Lipid Secret",
            "question": f"Why do manufacturers of products like {prod_name} heavily rely on refined Palm Oil or hydrogenated vegetable fats?",
            "options": [
                "It contains higher vitamin levels than cold-pressed extra virgin oils",
                "It is drastically cheaper, semi-solid at room temperature, and extends shelf-life indefinitely without spoiling",
                "It makes the product certified low-calorie"
            ],
            "correct_index": 1,
            "busted_myth": "Industrial palm and hydrogenated oils are used to maximize shelf life and profits, not for human cardiovascular health.",
            "explanation": "Refined palm and partially hydrogenated oils are chemically stable and cost a fraction of cold-pressed oils or dairy butter. However, they are dense in inflammatory palmitic acid and oxidizable fats linked to arterial plaque."
        })

    # 4. Fallback if still under 1 card: NOVA group / Ultra-Processed food question
    if not cards:
        cards.append({
            "id": 1,
            "badge": "True Label Forensics",
            "question": f"What is the single biggest forensic clue that {prod_name} is classified as an 'Ultra-Processed' food?",
            "options": [
                "It is packaged in a colorful plastic wrapper",
                "It contains chemical emulsifiers, artificial flavors, and industrial extracts you would never find in a home kitchen",
                "It was baked at a temperature above 200°C"
            ],
            "correct_index": 1,
            "busted_myth": "Ultra-processed foods are industrial chemical matrices designed for hyper-palatability, not whole nutrition.",
            "explanation": "NOVA Group 4 ultra-processed foods are formulations of ingredients derived from laboratory fractioning, modified starches, hydrolyzed proteins, and cosmetic chemical additives designed to make cheap raw materials taste hyper-palatable."
        })

    return cards[:2]



def build_visual_ingredients(product: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates structured proportional breakdown and visual cards for ingredients.
    """
    nutriments = product.get("nutriments_100g", {})
    sugars_100g = nutriments.get("sugars") or 0
    fat_100g = nutriments.get("fat") or 0
    sat_fat_100g = nutriments.get("saturated_fat") or 0
    proteins_100g = nutriments.get("proteins") or 0
    
    # 1 teaspoon of sugar = approx 4.2 grams
    sugar_spoons = round(float(sugars_100g) / 4.2, 1) if sugars_100g else 0

    ingredients_text = product.get("ingredients_text", "")
    additives_tags = product.get("additives_tags", [])
    
    # Estimate breakdown bars and pie chart percentages
    raw_sugar = max(0, min(65, int(float(sugars_100g)))) if sugars_100g else 10
    raw_fat = max(0, min(50, int(float(fat_100g)))) if fat_100g else 12
    raw_protein = max(0, min(30, int(float(proteins_100g)))) if proteins_100g else 6
    raw_additives = min(20, max(2, len(additives_tags) * 3)) if additives_tags else 3
    raw_base = max(15, 100 - (raw_sugar + raw_fat + raw_protein + raw_additives))

    # Normalize to strictly sum to 100%
    total_raw = raw_sugar + raw_fat + raw_protein + raw_additives + raw_base
    sugar_pct = max(2, round((raw_sugar / total_raw) * 100))
    fat_pct = max(2, round((raw_fat / total_raw) * 100))
    protein_pct = max(2, round((raw_protein / total_raw) * 100))
    additives_pct = max(1, round((raw_additives / total_raw) * 100))
    base_pct = 100 - (sugar_pct + fat_pct + protein_pct + additives_pct)
    if base_pct < 5:
        base_pct = 5
        sugar_pct = 100 - (base_pct + fat_pct + protein_pct + additives_pct)

    breakdown_bars = [
        {"name": "Added Sugars & Sweeteners", "percentage": sugar_pct, "color": "bg-rose-500", "warning": "High glycemic spike risk"},
        {"name": "Refined Fats & Industrial Oils", "percentage": fat_pct, "color": "bg-amber-500", "warning": "Saturated / modified lipids"},
        {"name": "Base Solids & Starches", "percentage": base_pct, "color": "bg-teal-600", "warning": "Flour, water or produce"},
        {"name": "Proteins & Dairy / Plant Solids", "percentage": protein_pct, "color": "bg-indigo-500", "warning": "Nutritional bulk"},
        {"name": "Chemical Additives, Dyes & Flavors", "percentage": additives_pct, "color": "bg-purple-600", "warning": "Preservatives & colorants"}
    ]

    # Highlight cards
    ingredient_cards = []
    prod_name_lower = (product.get("product_name") or "").lower()
    
    if "oreo" in prod_name_lower:
        ingredient_cards = [
            {"name": "Sugar & High Fructose Corn Syrup", "category": "Unhealthy Sugar", "proportion": "52% of filling", "visual_flag": "🔴 Heavy Spike", "fact": "Liquid corn syrup and powdered sugar form the base of the creme."},
            {"name": "Palm Oil & Canola Oil", "category": "Industrial Oil", "proportion": "30% of filling", "visual_flag": "🟠 High Saturated Fat", "fact": "Replaces real dairy milkfat to lower production costs."},
            {"name": "Alkalized Dutch Cocoa", "category": "Processed Cocoa", "proportion": "Cookie Wafers", "visual_flag": "🟡 Chemically Altered", "fact": "Alkalized with potassium carbonate to give extreme pitch-black color."}
        ]
    elif "ketchup" in prod_name_lower or "tomato sauce" in prod_name_lower:
        ingredient_cards = [
            {"name": "High Fructose Corn Syrup & Sugar", "category": "Refined Sugar", "proportion": "~28% of bottle", "visual_flag": "🔴 More than Cookies", "fact": "1 tablespoon has 4g of sugar, fueling visceral liver fat."},
            {"name": "Tomato Concentrate from Paste", "category": "Processed Produce", "proportion": "Base", "visual_flag": "🟡 Reconstituted Paste", "fact": "Factory concentrate mixed with water rather than fresh tomatoes."},
            {"name": "Distilled Vinegar & Salt", "category": "Preservative & Flavor", "proportion": "Acidulant", "visual_flag": "🟢 Standard", "fact": "Provides sharpness and shelf longevity."}
        ]
    elif "water" in prod_name_lower:
        ingredient_cards = [
            {"name": "Treated Municipal Tap Water", "category": "Reconstituted Base", "proportion": "99.9%", "visual_flag": "🟡 Municipal Water", "fact": "Tap water filtered through reverse osmosis; not mountain spring water."},
            {"name": "Added Synthetic Minerals (Magnesium Sulphate)", "category": "Chemical Additive", "proportion": "<0.1%", "visual_flag": "🟢 Taste Remineralization", "fact": "Artificially added back after RO strips all natural minerals."}
        ]
    elif "butter" in prod_name_lower or "spread" in prod_name_lower:
        ingredient_cards = [
            {"name": "Butterfat vs Hydrogenated Palm Oil", "category": "Lipid Base", "proportion": "80%+", "visual_flag": "🟠 Key Difference", "fact": "Real butter uses cow milkfat; table spreads use refined hydrogenated palm oil."},
            {"name": "Annatto / Beta-Carotene Dye", "category": "Food Coloring", "proportion": "Trace", "visual_flag": "🟡 Artificial Appearance", "fact": "Added to vegetable spreads to mimic the golden hue of real dairy butter."}
        ]
    else:
        ingredient_cards = [
            {"name": "Primary Base Ingredients", "category": "Main Formulation", "proportion": f"{base_pct}%", "visual_flag": "🟡 Industrial Base", "fact": "Formulated for mass commercial distribution and extended shelf-life."},
            {"name": "Sweeteners & Stabilizers", "category": "Additives", "proportion": f"{sugar_pct + additives_pct}%", "visual_flag": "🟠 Processing Agents", "fact": "Preserves consistency, hyper-palatability, and prevents rancidity."}
        ]

    pie_chart_slices = [
        {
            "label": "Added Sugars & Sweeteners",
            "percentage": sugar_pct,
            "color": "#f43f5e",
            "amount": f"{sugars_100g}g / 100g" if sugars_100g else f"{sugar_pct}% volume",
            "harmful_flag": sugar_pct >= 15,
            "target_system": "Metabolic & Hepatic (Liver)",
            "health_cause": "Triggers rapid blood glucose surges, prompts insulin resistance, fuels non-alcoholic fatty liver disease (NAFLD), and drives visceral belly fat storage."
        },
        {
            "label": "Refined Fats & Industrial Oils",
            "percentage": fat_pct,
            "color": "#f59e0b",
            "amount": f"{fat_100g}g / 100g" if fat_100g else f"{fat_pct}% volume",
            "harmful_flag": fat_pct >= 15,
            "target_system": "Cardiovascular & Endothelial",
            "health_cause": "Predominantly refined palm, soy, or seed oils rich in inflammatory palmitic acid; oxidizes during processing, contributing to vascular inflammation and elevated LDL cholesterol."
        },
        {
            "label": "Base Flour, Water & Starches",
            "percentage": base_pct,
            "color": "#0d9488",
            "amount": f"{base_pct}% bulk",
            "harmful_flag": False,
            "target_system": "Digestive",
            "health_cause": "Stripped refined carbohydrate bulk or reconstituted fluids; provides fast calories with natural dietary fiber and vitamins largely removed."
        },
        {
            "label": "Proteins & Dairy/Plant Solids",
            "percentage": protein_pct,
            "color": "#6366f1",
            "amount": f"{proteins_100g}g / 100g" if proteins_100g else f"{protein_pct}% volume",
            "harmful_flag": False,
            "target_system": "Musculoskeletal",
            "health_cause": "Beneficial macronutrient fraction supporting cellular repair and enzyme synthesis."
        },
        {
            "label": "Chemical Additives, Dyes & Stabilizers",
            "percentage": additives_pct,
            "color": "#a855f7",
            "amount": f"{len(additives_tags)} detected additives" if additives_tags else "Cosmetic Additives",
            "harmful_flag": True,
            "target_system": "Gut Microbiome & Neurological",
            "health_cause": "Synthetic emulsifiers (polysorbates, carrageenan) erode the protective intestinal mucosal barrier (leaky gut), while artificial azo dyes provoke histamine release and neurobehavioral hyperactivity."
        }
    ]

    return {
        "sugar_spoons_count": sugar_spoons,
        "breakdown_bars": breakdown_bars,
        "pie_chart_slices": pie_chart_slices,
        "ingredient_cards": ingredient_cards
    }


def build_international_comparison(product_name: str, brand: str, additives_detected: list, ingredients_text: str) -> Dict[str, Any]:
    """
    Compares the domestic/scanned product formulation against cleaner regulations in Europe (EU/UK) and Japan.
    """
    prod_lower = f"{product_name} {brand} {ingredients_text}".lower()

    if "oreo" in prod_lower or "cookie" in prod_lower or "biscuit" in prod_lower:
        return {
            "headline": "Oreo Cookies: US & Local Recipe vs. European & Japanese Formulation",
            "summary": "In the US and developing markets, Oreos are formulated with high-fructose corn syrup, bleached flour, and artificial vanillin. In Europe and Japan, food regulations restrict HFCS and GMOs, requiring real beet/cane sugar and sustainable plant extracts.",
            "regions": [
                {
                    "country": "Domestic / Scanned Recipe",
                    "flag": "🇺🇸 / 🇮🇳",
                    "sweetener": "High Fructose Corn Syrup & Refined White Sugar",
                    "fats": "Hydrogenated Palm & Canola Oils (0% Milkfat)",
                    "additives": "Synthetic Vanillin, Soy Lecithin",
                    "regulation_status": "Standard commercial recipe (Label must say 'Creme' not 'Cream')"
                },
                {
                    "country": "European Union & UK",
                    "flag": "🇪🇺 🇬🇧",
                    "sweetener": "100% Real Sugar (No High Fructose Corn Syrup allowed)",
                    "fats": "Sustainable RSPO Certified Non-Hydrogenated Palm Oil",
                    "additives": "Natural Vanilla Extract, Non-GMO Sunflower Lecithin",
                    "regulation_status": "Strict European EFSA safety compliance without corn syrup quotas"
                },
                {
                    "country": "Japan",
                    "flag": "🇯🇵",
                    "sweetener": "Japanese Fine Cane Sugar (Lower overall sweetness)",
                    "fats": "High-purity Vegetable Shortening without trans fats",
                    "additives": "Natural plant-derived vanilla; zero synthetic unapproved colorants",
                    "regulation_status": "Complies with Japanese MHLW strict food sanitation standards"
                }
            ]
        }
    elif "ketchup" in prod_lower or "sauce" in prod_lower or "heinz" in prod_lower:
        return {
            "headline": "Tomato Ketchup: High Fructose Corn Syrup vs. Real European Sugar",
            "summary": "In the US, standard Heinz Ketchup lists High Fructose Corn Syrup as its second largest ingredient. In Europe and the UK, HFCS is restricted, so Heinz uses real sugar and higher tomato paste density.",
            "regions": [
                {
                    "country": "United States & Local Recipe",
                    "flag": "🇺🇸 / 🇮🇳",
                    "sweetener": "High Fructose Corn Syrup (HFCS) + Liquid Corn Syrup",
                    "fats": "0g",
                    "additives": "Reconstituted tomato paste with water, salt, natural flavorings",
                    "regulation_status": "Contains 4g sugar per tablespoon primarily via corn syrup"
                },
                {
                    "country": "European Union & UK",
                    "flag": "🇪🇺 🇬🇧",
                    "sweetener": "100% Real Beet / Cane Sugar (Zero Corn Syrup)",
                    "fats": "0g",
                    "additives": "Higher real tomato solids percentage per bottle",
                    "regulation_status": "No HFCS permitted under European agricultural quotas"
                },
                {
                    "country": "Japan",
                    "flag": "🇯🇵",
                    "sweetener": "Natural Brewing Sugar & Seasoned Rice Vinegar",
                    "fats": "0g",
                    "additives": "No synthetic chemical preservatives or artificial colorants",
                    "regulation_status": "Strict Japanese Food Sanitation Act compliance"
                }
            ]
        }
    elif "doritos" in prod_lower or "chips" in prod_lower or "cheetos" in prod_lower or "crisp" in prod_lower:
        return {
            "headline": "Doritos: Banned Petroleum Dyes in Europe vs. Artificial Colors",
            "summary": "US and Indian Doritos use synthetic petroleum-derived dyes (Red 40, Yellow 5, Yellow 6). In the European Union and UK, these dyes require a mandatory warning label ('May have an adverse effect on activity and attention in children'), so PepsiCo reformulates Doritos with natural Paprika and Annatto extracts.",
            "regions": [
                {
                    "country": "Domestic / US / Local Recipe",
                    "flag": "🇺🇸 / 🇮🇳",
                    "sweetener": "Maltodextrin & Dextrose",
                    "fats": "Corn, Canola, or Palm Olein Oil",
                    "additives": "Red 40 (E129), Yellow 5 (E102), Yellow 6 (E110), Monosodium Glutamate",
                    "regulation_status": "Synthetically dyed with petroleum colorants"
                },
                {
                    "country": "European Union & UK",
                    "flag": "🇪🇺 🇬🇧",
                    "sweetener": "Natural Maize Starches",
                    "fats": "High-Oleic Sunflower / Rapeseed Oil",
                    "additives": "Natural Paprika Extract, Beetroot Red, Annatto (Zero artificial dyes)",
                    "regulation_status": "Synthetic dyes eliminated to avoid EU warning label"
                },
                {
                    "country": "Japan",
                    "flag": "🇯🇵",
                    "sweetener": "Soy sauce powder & Natural spices",
                    "fats": "Rice Bran Oil & Vegetable Oil",
                    "additives": "Natural plant-derived colorants, reduced artificial glutamate",
                    "regulation_status": "Approved under Japan Ministry of Health regulations"
                }
            ]
        }
    elif "water" in prod_lower:
        return {
            "headline": "Packaged Water Standards: Municipal RO Water vs. European Springs",
            "summary": "In Europe, the sale of municipal tap water under commercial water brands is heavily restricted; bottled water must be 'Natural Mineral Water' from protected springs. In developing markets and the US, most commercial bottled water is municipal tap water processed with reverse osmosis.",
            "regions": [
                {
                    "country": "Packaged Drinking Water (Domestic)",
                    "flag": "🇮🇳 / 🇺🇸",
                    "sweetener": "None",
                    "fats": "None",
                    "additives": "Synthetic Magnesium Sulphate & Potassium Bicarbonate",
                    "regulation_status": "Treated municipal tap / borewell water stripped by RO"
                },
                {
                    "country": "European Union (Natural Mineral Water)",
                    "flag": "🇪🇺",
                    "sweetener": "None",
                    "fats": "None",
                    "additives": "Zero chemical treatments or synthetic mineral additives allowed",
                    "regulation_status": "Must come directly from protected subterranean springs"
                },
                {
                    "country": "Japan (Natural Spring Water)",
                    "flag": "🇯🇵",
                    "sweetener": "None",
                    "fats": "None",
                    "additives": "Volcanic rock natural mineral filtration (Mount Fuji springs)",
                    "regulation_status": "Pure volcanic underground aquifers with zero chemical additives"
                }
            ]
        }
    elif "ice cream" in prod_lower or "frozen dessert" in prod_lower:
        return {
            "headline": "Dairy Ice Cream vs. Palm Oil 'Frozen Dessert'",
            "summary": "In many countries, corporations sell frozen desserts made from inexpensive palm oil and liquid vegetable fats instead of real milkfat. European and Japanese standards require strict front-of-pack declarations and minimum 10% pure dairy milkfat.",
            "regions": [
                {
                    "country": "Frozen Dessert (Developing Markets)",
                    "flag": "🇮🇳",
                    "sweetener": "Liquid Glucose & Sugar",
                    "fats": "Edible Vegetable Oil / Palm Kernel Oil (0% Milkfat)",
                    "additives": "Emulsifiers (E471), Stabilizers (E412, E407), Artificial Flavors",
                    "regulation_status": "Legally classified as 'Frozen Dessert', not Ice Cream"
                },
                {
                    "country": "European Union",
                    "flag": "🇪🇺",
                    "sweetener": "Pure Sugar & Natural Lactose",
                    "fats": "100% Real Dairy Cream & Whole Milk (Min. 10% Milkfat)",
                    "additives": "Natural Egg Yolk / Locust Bean Gum (No hydrogenated oils)",
                    "regulation_status": "Strict 'Ice Cream' protected dairy designation"
                },
                {
                    "country": "Japan (Ice Cream Grade A)",
                    "flag": "🇯🇵",
                    "sweetener": "Refined Sugar & Natural Dairy",
                    "fats": "Hokkaido Fresh Dairy Milkfat (Min. 15% Milk Solids)",
                    "additives": "Zero vegetable palm oil replacements",
                    "regulation_status": "Premium 'Ice Cream' (Aisu-kuriimu) standard"
                }
            ]
        }
    else:
        return {
            "headline": "International Formulation Differences (EU & Japan vs. Domestic)",
            "summary": "Multinational manufacturers frequently reformulate products sold in the European Union and Japan to remove synthetic food dyes, brominated oils, and high-fructose corn syrups that are prohibited or require cancer/hyperactivity warnings overseas.",
            "regions": [
                {
                    "country": "Domestic Formulation",
                    "flag": "🇺🇸 / 🇮🇳",
                    "sweetener": "Refined sugars, corn syrups, and standard preservatives",
                    "fats": "Refined palm and vegetable oil blends",
                    "additives": "Standard local food additives permitted by domestic limits",
                    "regulation_status": "Standard mass-market recipe"
                },
                {
                    "country": "European Union (EU)",
                    "flag": "🇪🇺",
                    "sweetener": "Real sugar; strict EU quotas limiting High Fructose Corn Syrup",
                    "fats": "Sustainable RSPO certified oils; trans fat limit < 2g per 100g",
                    "additives": "Synthetic dyes replaced by natural turmeric, paprika, and beet extracts",
                    "regulation_status": "Complies with strict European Food Safety Authority (EFSA) bans"
                },
                {
                    "country": "Japan",
                    "flag": "🇯🇵",
                    "sweetener": "Traditional unrefined cane sugars and natural rice sweeteners",
                    "fats": "Low-temperature pressed plant oils free from harsh hydrogenated trans fats",
                    "additives": "Strict positive list enforced by Japan Ministry of Health, Labour and Welfare",
                    "regulation_status": "Free from petroleum-derived artificial preservatives"
                }
            ]
        }



def fetch_product_from_openfoodfacts(query_or_barcode: str) -> Optional[Dict[str, Any]]:
    """
    Fetches raw product information from the Open Food Facts API v2.
    Supports barcodes (exact lookup) and text search queries.
    """
    query = str(query_or_barcode).strip()
    if not query:
        return None

    # Check if the query is a numeric barcode (e.g. UPC/EAN 8 to 14 digits)
    is_barcode = query.isdigit() and len(query) >= 6

    try:
        if is_barcode:
            url = f"https://world.openfoodfacts.org/api/v2/product/{query}.json"
            resp = requests.get(url, headers=OPENFOODFACTS_HEADERS, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == 1 and "product" in data:
                    return _normalize_product_data(data["product"], barcode=query)
            # If not found by direct barcode, try fallback search
            logger.info(f"Direct barcode {query} not found, trying search API...")

        # Search endpoint
        search_url = f"https://world.openfoodfacts.org/api/v2/search?search_terms={requests.utils.quote(query)}&page_size=5"
        resp = requests.get(search_url, headers=OPENFOODFACTS_HEADERS, timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("products", [])
            if products:
                # Return the best matching product
                return _normalize_product_data(products[0], barcode=products[0].get("code", query))

    except Exception as e:
        logger.error(f"OpenFoodFacts API error for query '{query}': {e}")

    return None


def _normalize_product_data(raw_prod: Dict[str, Any], barcode: str) -> Dict[str, Any]:
    """
    Standardizes Open Food Facts raw product data for UI display and AI ingestion.
    """
    nutriments = raw_prod.get("nutriments", {})
    nutrient_levels = raw_prod.get("nutrient_levels", {})

    return {
        "barcode": barcode or raw_prod.get("code", ""),
        "product_name": raw_prod.get("product_name") or raw_prod.get("product_name_en") or "Unknown Product",
        "brand": raw_prod.get("brands") or "Unknown Brand",
        "categories": raw_prod.get("categories", ""),
        "image_url": raw_prod.get("image_front_url") or raw_prod.get("image_url") or "",
        "ingredients_text": raw_prod.get("ingredients_text") or raw_prod.get("ingredients_text_en") or "",
        "additives_tags": raw_prod.get("additives_tags", []),
        "allergens_tags": raw_prod.get("allergens_tags", []),
        "nutriscore_grade": (raw_prod.get("nutriscore_grade") or "").upper(),
        "nova_group": raw_prod.get("nova_group"),
        "ecoscore_grade": (raw_prod.get("ecoscore_grade") or "").upper(),
        "serving_size": raw_prod.get("serving_size", "100g"),
        "nutrient_levels": {
            "fat": nutrient_levels.get("fat", "unknown"),
            "saturated_fat": nutrient_levels.get("saturated-fat", "unknown"),
            "sugars": nutrient_levels.get("sugars", "unknown"),
            "salt": nutrient_levels.get("salt", "unknown"),
        },
        "nutriments_100g": {
            "energy_kcal": nutriments.get("energy-kcal_100g") or nutriments.get("energy-kcal"),
            "sugars": nutriments.get("sugars_100g"),
            "fat": nutriments.get("fat_100g"),
            "saturated_fat": nutriments.get("saturated-fat_100g"),
            "salt": nutriments.get("salt_100g"),
            "sodium": nutriments.get("sodium_100g"),
            "proteins": nutriments.get("proteins_100g"),
            "fiber": nutriments.get("fiber_100g"),
        }
    }


def analyze_with_ai(openai_client, product: Dict[str, Any], patient_profile: Optional[Dict[str, Any]] = None, query_text: str = "") -> Dict[str, Any]:
    """
    Uses OpenAI (gpt-4o) to generate the "True Label", identifying dangerous ingredients,
    causes/health risks, banned jurisdictions, and matching with the patient's medical profile.
    Falls back gracefully to local deterministic analysis if OpenAI is unavailable.
    """
    if not openai_client:
        return _fallback_local_analysis(product, patient_profile, query_text)

    # Prepare medical context if patient profile is passed
    patient_info_str = "None provided (General Public User)"
    if patient_profile:
        allergies = ", ".join(patient_profile.get("allergies", [])) or "None"
        conditions = ", ".join(patient_profile.get("existingConditions", [])) or "None"
        patient_info_str = (
            f"Patient Name: {patient_profile.get('fullName', 'Patient')}\n"
            f"Known Allergies: {allergies}\n"
            f"Pre-existing Chronic Conditions: {conditions}\n"
            f"Blood Group: {patient_profile.get('bloodGroup', 'Unknown')}"
        )

    system_prompt = (
        "You are 'SafeBites AI', a board-certified clinical toxicologist, food forensic scientist, and nutrition watchdog.\n"
        "Your mission is to reveal the 'TRUE LABEL' of commercial food products by exposing marketing deceptions, "
        "identifying dangerous and controversial ingredients, revealing in which countries/regions they are banned or restricted, "
        "and evaluating acute health risks for the specific patient.\n\n"
        "CRITICAL INSTRUCTIONS:\n"
        "1. Identify every harmful or controversial additive, artificial dye, preservative, emulsifier, or hidden sugar (e.g. Red 40, Titanium Dioxide, Potassium Bromate, BHA/BHT, HFCS, Sodium Nitrite, BVO, Carrageenan).\n"
        "2. For each dangerous ingredient, specify the exact health risks (e.g., DNA damage, hyperactivity, endocrine disruption, cancer risk, NAFLD) AND list the specific countries or bodies where it is banned or strictly restricted (e.g., European Union, UK, Japan, Canada, California Prop 65).\n"
        "3. Provide a 'True Label' reality check: What the front package claims vs what is actually inside.\n"
        "4. Calculate a 0-100 'Safety Score' (100 = 100% clean whole food, 0 = toxic chemical cocktail).\n"
        "5. Cross-reference with the patient's medical profile (allergies and chronic conditions like Diabetes, Hypertension, Asthma, Heart disease) and generate clear medical warnings.\n"
        "6. Provide 2-3 healthier, cleaner alternatives that satisfy the same craving.\n"
        "7. Generate 1 to 2 dynamic, jaw-dropping flashcard trivia questions tailored specifically to THIS product's real ingredients, sneaky labeling loopholes (e.g. 'creme' vs 'cream', 'frozen dessert' vs 'ice cream', packaged municipal water vs natural mineral water, high-fructose syrup volume, Dutch alkali cocoa, or specific dangerous additives found in this item).\n"
        "ALWAYS return a strictly valid JSON object matching the requested schema."
    )

    user_prompt = f"""Analyze this food product for SafeBites True Label:

PRODUCT DATA:
- Name: {product.get('product_name')}
- Brand: {product.get('brand')}
- Barcode: {product.get('barcode')}
- Ingredients: {product.get('ingredients_text') or 'Not explicitly listed; infer based on brand and category.'}
- Additives Tags: {', '.join(product.get('additives_tags', []))}
- NutriScore: {product.get('nutriscore_grade')} | NOVA Group: {product.get('nova_group')}
- Nutrient Levels: {json.dumps(product.get('nutrient_levels', {}))}
- 100g Nutriments: {json.dumps(product.get('nutriments_100g', {}))}

PATIENT MEDICAL PROFILE:
{patient_info_str}

Return a valid JSON object with the following structure:
{{
  "safety_score": <int 0 to 100>,
  "safety_rating": "<'Hazardous' | 'High Concern' | 'Moderate Caution' | 'Safe'>",
  "summary": "<2-sentence clear takeaway of the food's safety>",
  "true_label": {{
    "marketing_claim": "<what the manufacturer promotes, e.g. 'Bursting with real fruit juice'>",
    "reality_check": "<what is actually in it, e.g. '0% fruit, sweetened with 38g corn syrup and coloured with petroleum Red 40'>",
    "processing_classification": "<e.g. 'Ultra-Processed Formulation (NOVA Group 4)'>"
  }},
  "flash_quiz": [
    {{
      "id": 1,
      "badge": "<e.g. Legal Labeling Secret | Sugar Deception | Chemical Additive Alert>",
      "question": "<engaging, dynamic question tailored specifically to this product's actual formulation or ingredients>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
      "correct_index": <int 0-3>,
      "busted_myth": "<punchy 1-sentence myth buster>",
      "explanation": "<scientific eye-opening explanation of this ingredient or legal loophole>"
    }}
  ],
  "dangerous_ingredients": [
    {{
      "name": "<Ingredient Name, e.g. Red 40 / Allura Red AC>",
      "e_number": "<e.g. E129>",
      "hazard_level": "<'High' | 'Moderate' | 'Critical'>",
      "health_risks": "<specific physiological effects, e.g. DNA mutations, ADHD flare-ups, gut inflammation>",
      "banned_in": ["<e.g. European Union (Mandatory warning label)>", "<e.g. Norway>", "<e.g. California Schools>"],
      "why_used": "<e.g. Cheap artificial dye derived from petroleum>"
    }}
  ],
  "banned_summary": {{
    "total_banned_or_restricted_substances": <int>,
    "jurisdictions_list": ["<Country 1>", "<Country 2>"]
  }},
  "patient_health_alerts": [
    {{
      "severity": "<'CRITICAL' | 'WARNING' | 'INFO'>",
      "title": "<e.g. Direct Allergy Conflict: Peanuts>",
      "message": "<e.g. Contains peanut oil which conflicts directly with patient Priya Sharma's recorded Penicillin/Peanut allergy.>"
    }}
  ],
  "nutritional_flags": [
    "<e.g. 1 serving contains equivalent of 9 teaspoons of sugar>",
    "<e.g. Contains high-sodium MSG harmful for Hypertension>"
  ],
  "clean_alternatives": [
    {{
      "name": "<Alternative Product / Recipe Name>",
      "brand": "<Brand or 'Homemade / Clean Brands'>",
      "why_better": "<e.g. 100% organic fruit purée without artificial coloring or added corn syrup>"
    }}
  ]
}}
"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        ai_data = json.loads(response.choices[0].message.content)

        # Validate dynamic flash quiz; if OpenAI missed it or gave empty array, synthesize dynamically
        raw_quiz = ai_data.get("flash_quiz")
        if not raw_quiz or not isinstance(raw_quiz, list) or len(raw_quiz) == 0:
            ai_data["flash_quiz"] = build_dynamic_food_flash_quiz(
                product,
                detected_dangerous=ai_data.get("dangerous_ingredients", []),
                query_text=query_text
            )
        else:
            # Ensure correct format
            formatted_quiz = []
            for idx, q in enumerate(raw_quiz[:2]):
                if isinstance(q, dict) and "question" in q and "options" in q:
                    formatted_quiz.append({
                        "id": idx + 1,
                        "badge": q.get("badge") or "True Label Challenge",
                        "question": q["question"],
                        "options": q["options"],
                        "correct_index": int(q.get("correct_index", 0)),
                        "busted_myth": q.get("busted_myth") or "What seems ordinary on the label is chemically engineered.",
                        "explanation": q.get("explanation") or "Commercial food processing frequently substitutes natural ingredients with industrial compounds."
                    })
            ai_data["flash_quiz"] = formatted_quiz if formatted_quiz else build_dynamic_food_flash_quiz(
                product,
                detected_dangerous=ai_data.get("dangerous_ingredients", []),
                query_text=query_text
            )

        if "visual_ingredients" not in ai_data or not ai_data.get("visual_ingredients"):
            ai_data["visual_ingredients"] = build_visual_ingredients(product)

        ai_data["international_comparison"] = build_international_comparison(
            product.get("product_name", ""),
            product.get("brand", ""),
            ai_data.get("dangerous_ingredients", []),
            product.get("ingredients_text", "")
        )

        return ai_data
    except Exception as e:
        logger.error(f"SafeBites OpenAI analysis error: {e}")
        return _fallback_local_analysis(product, patient_profile, query_text)


def _fallback_local_analysis(product: Dict[str, Any], patient_profile: Optional[Dict[str, Any]] = None, query_text: str = "") -> Dict[str, Any]:
    """
    Deterministic rule-based analysis used when OpenAI is offline or unconfigured.
    Scans ingredients and additives against our curated KNOWN_ADDITIVES_DB.
    """
    ingredients_lower = (product.get("ingredients_text") or "").lower()
    additives_tags = [t.lower().replace("en:", "").replace("-", "") for t in product.get("additives_tags", [])]

    detected_dangerous = []
    jurisdictions_set = set()

    for code, info in KNOWN_ADDITIVES_DB.items():
        is_present = False
        # Check additive tags
        if code in additives_tags or f"e{code}" in additives_tags or f"e-{code}" in additives_tags:
            is_present = True
        else:
            # Generate search tokens from name and code
            tokens = [code]
            clean_name = info["name"].lower().replace("(", "").replace(")", "").replace("/", ",")
            for part in clean_name.split(","):
                part_stripped = part.strip()
                if len(part_stripped) >= 3:
                    tokens.append(part_stripped)

            for token in tokens:
                if token in ingredients_lower:
                    is_present = True
                    break

        if not is_present:
            if code == "red3" and ("red 3" in ingredients_lower or "erythrosine" in ingredients_lower or "e127" in ingredients_lower):
                is_present = True
            elif code == "bvo" and ("brominated vegetable oil" in ingredients_lower or "bvo" in ingredients_lower):
                is_present = True
            elif code == "trans_fats" and ("partially hydrogenated" in ingredients_lower or "hydrogenated oil" in ingredients_lower):
                is_present = True
            elif code == "hfcs" and ("high fructose" in ingredients_lower or "glucose-fructose" in ingredients_lower or "corn syrup" in ingredients_lower):
                is_present = True
            elif code == "e171" and "titanium" in ingredients_lower:
                is_present = True
            elif code == "e129" and ("red 40" in ingredients_lower or "allura red" in ingredients_lower):
                is_present = True
            elif code == "e102" and ("yellow 5" in ingredients_lower or "tartrazine" in ingredients_lower):
                is_present = True
            elif code == "e110" and ("yellow 6" in ingredients_lower or "sunset yellow" in ingredients_lower):
                is_present = True
            elif code == "e621" and ("monosodium glutamate" in ingredients_lower or " msg " in f" {ingredients_lower} "):
                is_present = True
            elif code == "e211" and "sodium benzoate" in ingredients_lower:
                is_present = True
            elif code == "e951" and "aspartame" in ingredients_lower:
                is_present = True
            elif code == "e955" and ("sucralose" in ingredients_lower or "splenda" in ingredients_lower):
                is_present = True

        if is_present:
            detected_dangerous.append({
                "name": info["name"],
                "e_number": code.upper(),
                "hazard_level": info["hazard_level"],
                "health_risks": info["health_risks"],
                "banned_in": info["banned_in"],
                "why_used": info["why_used"]
            })
            for b in info["banned_in"]:
                jurisdictions_set.add(b.split(" (")[0])

    # Calculate Score
    penalty = len(detected_dangerous) * 18
    if product.get("nova_group") == 4:
        penalty += 15
    if product.get("nutriscore_grade") in ["D", "E"]:
        penalty += 12

    safety_score = max(10, min(95, 95 - penalty))
    if safety_score < 40:
        safety_rating = "Hazardous"
    elif safety_score < 60:
        safety_rating = "High Concern"
    elif safety_score < 80:
        safety_rating = "Moderate Caution"
    else:
        safety_rating = "Safe"

    # Patient Alerts
    patient_alerts = []
    if patient_profile:
        allergies = [a.lower() for a in patient_profile.get("allergies", [])]
        conditions = [c.lower() for c in patient_profile.get("existingConditions", [])]

        for allergy in allergies:
            if allergy in ingredients_lower:
                patient_alerts.append({
                    "severity": "CRITICAL",
                    "title": f"🚨 Direct Allergy Alert: {allergy.title()}",
                    "message": f"This product lists '{allergy}' in its ingredients, directly conflicting with your recorded allergy!"
                })

        if "hypertension" in conditions and (product.get("nutrient_levels", {}).get("salt") == "high" or "salt" in ingredients_lower):
            patient_alerts.append({
                "severity": "WARNING",
                "title": "⚠️ High Sodium Caution",
                "message": "High sodium and salt content detected. This can adversely elevate blood pressure for patients with Hypertension."
            })

        if "diabetes" in conditions and (product.get("nutrient_levels", {}).get("sugars") == "high" or "sugar" in ingredients_lower or "syrup" in ingredients_lower):
            patient_alerts.append({
                "severity": "WARNING",
                "title": "⚠️ Glycemic Spike Warning",
                "message": "Elevated refined sugar or high-fructose syrups detected. May trigger sudden glycemic spikes."
            })

    nutritional_flags = []
    if product.get("nutrient_levels", {}).get("sugars") == "high":
        nutritional_flags.append("High sugar content exceeding recommended daily limits")
    if product.get("nutrient_levels", {}).get("saturated_fat") == "high":
        nutritional_flags.append("High saturated fat level linked to cardiovascular risks")
    if product.get("nova_group") == 4:
        nutritional_flags.append("Ultra-processed formulation (NOVA 4) with industrial additives")

    return {
        "safety_score": safety_score,
        "safety_rating": safety_rating,
        "summary": f"Contains {len(detected_dangerous)} controversial additives or ingredients with documented health risks and international restrictions.",
        "true_label": {
            "marketing_claim": f"Packaged as a convenient {product.get('product_name', 'snack')}.",
            "reality_check": f"Formulated with industrial ingredients, high processing, and {len(detected_dangerous)} detected hazardous additives.",
            "processing_classification": f"NOVA {product.get('nova_group', '3/4')} - Ultra Processed"
        },
        "dangerous_ingredients": detected_dangerous,
        "banned_summary": {
            "total_banned_or_restricted_substances": len(detected_dangerous),
            "jurisdictions_list": list(jurisdictions_set)
        },
        "patient_health_alerts": patient_alerts,
        "nutritional_flags": nutritional_flags,
        "clean_alternatives": [
            {
                "name": "Organic Whole Food Alternative",
                "brand": "Clean Kitchen Essentials",
                "why_better": "Made from 100% natural unrefined ingredients without artificial preservatives or coloring."
            }
        ],
        "flash_quiz": build_dynamic_food_flash_quiz(
            product,
            detected_dangerous=detected_dangerous,
            query_text=query_text
        ),
        "visual_ingredients": build_visual_ingredients(product),
        "international_comparison": build_international_comparison(
            product.get("product_name", ""),
            product.get("brand", ""),
            detected_dangerous,
            product.get("ingredients_text", "")
        )
    }

