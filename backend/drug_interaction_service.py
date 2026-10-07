import os
import csv
import re
import logging

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "ddinter_downloads_code_V.csv")

# Clinical pneumonia and critical respiratory antibiotic drug-drug interaction rules
# High-severity pairs with established clinical mechanisms & management guidance
CLINICAL_INTERACTION_RULES = [
    {
        "drugs_a": ["azithromycin", "clarithromycin", "erythromycin", "roxithromycin", "zithromax", "azithral", "azy", "claribid", "biaxin"],
        "drugs_b": ["levofloxacin", "moxifloxacin", "ciprofloxacin", "ofloxacin", "gemifloxacin", "levaquin", "avelox", "cifran", "levomac", "lupimax"],
        "severity": "CRITICAL",
        "level": "Major",
        "category": "Pneumonia Regimen - Fatal Cardiac Arrhythmia",
        "title": "Severe Additive QT Prolongation & Torsades de Pointes",
        "mechanism": "Both Macrolides (Azithromycin/Clarithromycin) and Fluoroquinolones (Levofloxacin/Moxifloxacin) block the cardiac hERG/IKr potassium channels. Co-administration causes additive delay in ventricular repolarization, drastically elevating risk of polymorphic ventricular tachycardia (Torsades de Pointes) and sudden cardiac arrest.",
        "recommendation": "CONTRAINDICATED IN PNEUMONIA. Do not prescribe together. For atypical coverage in CAP, use a Beta-Lactam (e.g. Amoxicillin-Clavulanate) combined with Azithromycin OR use Respiratory Fluoroquinolone monotherapy (Levofloxacin alone), never both together."
    },
    {
        "drugs_a": ["levofloxacin", "moxifloxacin", "ciprofloxacin", "ofloxacin", "norfloxacin", "levaquin", "cifran", "levomac", "lupimax", "avelox"],
        "drugs_b": ["ibuprofen", "diclofenac", "naproxen", "combiflam", "brufen", "voveran", "piroxicam", "ketorolac", "mefenamic", "indomethacin", "etoricoxib", "celecoxib", "aspirin"],
        "severity": "CRITICAL",
        "level": "Major",
        "category": "Pneumonia Regimen - Neurotoxicity & Seizures",
        "title": "Severe CNS Toxicity & Epileptic Seizure Risk",
        "mechanism": "Fluoroquinolones (Levofloxacin/Ciprofloxacin) displace and inhibit gamma-aminobutyric acid (GABA) from binding to central GABA-A receptors. Concomitant NSAIDs (Ibuprofen/Diclofenac) markedly potentiate this GABA antagonism, precipitating severe epileptogenic seizures and central nervous system toxicity even in patients with no history of convulsions.",
        "recommendation": "HIGH RISK COMBINATION. Avoid NSAIDs when prescribing Fluoroquinolones for pneumonia fever or chest pain. Substitute NSAIDs with Paracetamol (Acetaminophen) for antipyresis and pain control."
    },
    {
        "drugs_a": ["clarithromycin", "erythromycin", "claribid", "biaxin"],
        "drugs_b": ["atorvastatin", "simvastatin", "lovastatin", "lipitor", "atorva", "storvas", "zocor"],
        "severity": "CRITICAL",
        "level": "Major",
        "category": "Pneumonia Regimen - Severe Rhabdomyolysis",
        "title": "Life-Threatening Rhabdomyolysis & Acute Renal Failure",
        "mechanism": "Clarithromycin is a potent, irreversible CYP3A4 cytochrome inhibitor. It blocks hepatic clearance of CYP3A4-metabolized statins (Atorvastatin/Simvastatin), raising statin plasma concentrations by 400% to 1000%, causing massive skeletal muscle breakdown (rhabdomyolysis), myoglobinuria, and acute tubular necrosis.",
        "recommendation": "ABSOLUTE CONTRAINDICATION. Suspend Atorvastatin/Simvastatin immediately during Clarithromycin therapy, or substitute Clarithromycin with Azithromycin (minimal CYP3A4 inhibition) or Doxycycline."
    },
    {
        "drugs_a": ["amoxicillin", "ampicillin", "augmentin", "moxclav", "clavulanate", "amoxycillin", "piperacillin", "penicillin"],
        "drugs_b": ["doxycycline", "minocycline", "tetracycline", "doxicip", "doxt", "monodox", "vibramycin"],
        "severity": "MAJOR",
        "level": "Major",
        "category": "Pneumonia Regimen - Antibacterial Antagonism",
        "title": "Pharmacodynamic Antagonism: Reduced Antibacterial Efficacy",
        "mechanism": "Beta-lactams (Amoxicillin/Augmentin) are bactericidal agents that require actively multiplying and dividing bacteria to disrupt peptidoglycan cell wall synthesis. Doxycycline is a bacteriostatic 30S protein synthesis inhibitor that arrests bacterial growth, thereby blunting the bactericidal killing action of Amoxicillin and increasing risk of treatment failure in bacterial pneumonia.",
        "recommendation": "Avoid concurrent administration in community-acquired pneumonia. If dual coverage is indicated for atypical pathogens, pair Beta-lactams with a Macrolide (Azithromycin) instead of Doxycycline, or administer Doxycycline as monotherapy."
    },
    {
        "drugs_a": ["levofloxacin", "ciprofloxacin", "moxifloxacin", "ofloxacin", "doxycycline", "doxicip", "levaquin", "cifran"],
        "drugs_b": ["antacid", "gelusil", "digene", "magnesium hydroxide", "aluminium hydroxide", "calcium carbonate", "sucralfate", "mucaine", "cremaffin", "eno"],
        "severity": "MAJOR",
        "level": "Major",
        "category": "Pneumonia Regimen - Chelation & Absorption Failure",
        "title": "Chelation Complexation: 70-90% Reduction in Antibiotic Bioavailability",
        "mechanism": "Divalent and trivalent metal cations (Al3+, Mg2+, Ca2+, Fe2+) in antacids chelate with Fluoroquinolones (Levofloxacin) and Tetracyclines (Doxycycline) in the gastrointestinal tract, forming insoluble non-absorbable chelates. This slashes oral antibiotic absorption by up to 90%, causing clinical failure in pneumonia treatment and rapid bacterial resistance.",
        "recommendation": "Do not take antacids concurrently. Administer oral antibiotics at least 2 hours before or 4 to 6 hours after any cation-containing antacids or mineral supplements."
    },
    {
        "drugs_a": ["linezolid", "linid", "zyvox", "lizomac"],
        "drugs_b": ["tramadol", "ultracet", "fluoxetine", "sertraline", "paroxetine", "citalopram", "escitalopram", "duloxetine", "venlafaxine", "amitriptyline"],
        "severity": "CRITICAL",
        "level": "Major",
        "category": "MRSA Pneumonia - Fatal Serotonin Syndrome",
        "title": "Severe / Fatal Serotonin Syndrome & Hyperpyrexia",
        "mechanism": "Linezolid (used for MRSA or resistant pneumonia) is a non-selective, reversible Monoamine Oxidase Inhibitor (MAOI). Co-administration with serotonergic analgesics (Tramadol) or SSRI antidepressants prevents serotonin breakdown, producing toxic systemic serotonin accumulation characterized by hyperthermia (>40°C), neuromuscular clonus, delirium, and circulatory collapse.",
        "recommendation": "CONTRAINDICATED. Discontinue serotonergic agents before initiating Linezolid, or select alternative MRSA pneumonia antibiotics (e.g. Vancomycin, Teicoplanin, or Ceftaroline)."
    },
    {
        "drugs_a": ["azithromycin", "clarithromycin", "erythromycin"],
        "drugs_b": ["digoxin", "lanoxin"],
        "severity": "MAJOR",
        "level": "Major",
        "category": "Pneumonia Regimen - Digoxin Toxicity",
        "title": "P-Glycoprotein Inhibition & Digoxin Overdose",
        "mechanism": "Macrolides inhibit the intestinal P-glycoprotein efflux pump and eradicate Eubacterium lentum gut flora that metabolizes digoxin. This doubles digoxin bioavailability and serum concentrations, causing life-threatening digitalis toxicity, complete AV block, and fatal arrhythmias.",
        "recommendation": "If co-prescribing is unavoidable, reduce digoxin dosage by 30-50% and monitor ECG rhythm and serum digoxin concentrations closely."
    },
    {
        "drugs_a": ["azithromycin", "clarithromycin", "erythromycin", "levofloxacin", "ciprofloxacin", "moxifloxacin"],
        "drugs_b": ["warfarin", "acenocoumarol", "coumadin", "acitrom"],
        "severity": "MAJOR",
        "level": "Major",
        "category": "Pneumonia Regimen - Hemorrhagic Risk",
        "title": "Severe INR Elevation & Major Bleeding Risk",
        "mechanism": "Macrolides and Fluoroquinolones suppress vitamin K-synthesizing intestinal microflora and inhibit CYP-mediated metabolism of oral anticoagulants. Co-administration can cause supra-therapeutic INR elevation (>5.0) and major internal hemorrhage.",
        "recommendation": "Monitor PT/INR on days 3 and 5 of antibiotic therapy. Consider prophylactic 20-30% reduction in Warfarin/Acenocoumarol dosage."
    },
    {
        "drugs_a": ["levofloxacin", "moxifloxacin", "ciprofloxacin", "azithromycin", "clarithromycin"],
        "drugs_b": ["amiodarone", "sotalol", "cordarone", "procainamide"],
        "severity": "CRITICAL",
        "level": "Major",
        "category": "Cardiac / Pneumonia - Fatal Arrhythmia",
        "title": "Extreme QT Prolongation & Fatal Ventricular Fibrillation",
        "mechanism": "Concomitant use of antiarrhythmics (Amiodarone/Sotalol) with QT-prolonging pneumonia antibiotics causes profound repolarization dispersion, triggering refractory ventricular fibrillation.",
        "recommendation": "ABSOLUTELY CONTRAINDICATED. Choose alternative antibiotics with no QT liability (e.g. Amoxicillin-Clavulanate, Ceftriaxone, or Cefuroxime)."
    },
    {
        "drugs_a": ["doxycycline", "tetracycline", "minocycline"],
        "drugs_b": ["isotretinoin", "tretinoin", "retin-a", "acutret"],
        "severity": "CRITICAL",
        "level": "Major",
        "category": "Dermatology / Respiratory - Pseudotumor Cerebri",
        "title": "Benign Intracranial Hypertension (Pseudotumor Cerebri)",
        "mechanism": "Both Doxycycline and Isotretinoin elevate intracranial CSF pressure. Co-administration dramatically increases risk of papilledema, optic nerve atrophy, and permanent blindness.",
        "recommendation": "Do not co-prescribe. Maintain at least a 7-day washout period between oral retinoids and tetracyclines."
    }
]

# Cache for CSV interactions
_csv_interactions_cache = None

def _load_csv_interactions():
    """
    Loads and indexes the 12,026 interaction pairs from ddinter_downloads_code_V.csv.
    Keyed as normalized tuple of (min(drugA, drugB), max(drugA, drugB)).
    """
    global _csv_interactions_cache
    if _csv_interactions_cache is not None:
        return _csv_interactions_cache

    cache = {}
    if not os.path.exists(CSV_PATH):
        logging.warning(f"ddinter CSV not found at {CSV_PATH}")
        _csv_interactions_cache = cache
        return cache

    try:
        with open(CSV_PATH, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            for row in reader:
                drug_a = (row.get("Drug_A") or "").strip().lower()
                drug_b = (row.get("Drug_B") or "").strip().lower()
                level = (row.get("Level") or "Moderate").strip()
                if drug_a and drug_b:
                    k = tuple(sorted([drug_a, drug_b]))
                    # Keep the most severe interaction if duplicate
                    if k not in cache or level.lower() == "major":
                        cache[k] = {
                            "drugA": row.get("Drug_A"),
                            "drugB": row.get("Drug_B"),
                            "level": level,
                            "idA": row.get("DDInterID_A"),
                            "idB": row.get("DDInterID_B")
                        }
        logging.info(f"Loaded {len(cache)} unique interaction pairs from ddinter CSV")
    except Exception as e:
        logging.error(f"Error loading ddinter CSV: {e}")

    _csv_interactions_cache = cache
    return cache


def normalize_medicine_name(name):
    """
    Strips dosage (500mg, 1g), route/form (tab, syrup, duo), and extracts base tokens.
    """
    if not name:
        return ""
    clean = name.lower().strip()
    # Remove dosage patterns like 500mg, 625 mg, 10ml, etc.
    clean = re.sub(r"\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|tablets?|capsules?|duo|dt|ds|sr|er|cr)\b", "", clean)
    # Remove punctuation
    clean = re.sub(r"[^\w\s-]", " ", clean)
    return " ".join(clean.split()).strip()


def check_single_pair(med_a_raw, med_b_raw, active_compounds_a=None, active_compounds_b=None):
    """
    Checks if two medicines have a known clinical or dataset interaction.
    Returns interaction dict or None.
    """
    norm_a = normalize_medicine_name(med_a_raw)
    norm_b = normalize_medicine_name(med_b_raw)
    
    tokens_a = set(norm_a.split() + [norm_a])
    tokens_b = set(norm_b.split() + [norm_b])
    
    if active_compounds_a:
        for c in active_compounds_a:
            clean_c = normalize_medicine_name(c)
            tokens_a.update(clean_c.split() + [clean_c])
            
    if active_compounds_b:
        for c in active_compounds_b:
            clean_c = normalize_medicine_name(c)
            tokens_b.update(clean_c.split() + [clean_c])

    # 1. Clinical Priority Rules (Pneumonia and critical respiratory contraindications)
    for rule in CLINICAL_INTERACTION_RULES:
        # Check if A matches rule's drugs_a and B matches rule's drugs_b, or vice-versa
        match_a_in_rule_a = any(any(r_drug in t or t in r_drug for r_drug in rule["drugs_a"]) for t in tokens_a)
        match_b_in_rule_b = any(any(r_drug in t or t in r_drug for r_drug in rule["drugs_b"]) for t in tokens_b)

        match_b_in_rule_a = any(any(r_drug in t or t in r_drug for r_drug in rule["drugs_a"]) for t in tokens_b)
        match_a_in_rule_b = any(any(r_drug in t or t in r_drug for r_drug in rule["drugs_b"]) for t in tokens_a)

        if (match_a_in_rule_a and match_b_in_rule_b) or (match_b_in_rule_a and match_a_in_rule_b):
            return {
                "drugA": med_a_raw,
                "drugB": med_b_raw,
                "severity": rule["severity"],
                "level": rule["level"],
                "category": rule["category"],
                "title": rule["title"],
                "mechanism": rule["mechanism"],
                "recommendation": rule["recommendation"],
                "isClinicalRule": True
            }

    # 2. DDInter 12,026 Pairs Dataset Check
    csv_db = _load_csv_interactions()
    if csv_db:
        for t_a in tokens_a:
            if len(t_a) < 3:
                continue
            for t_b in tokens_b:
                if len(t_b) < 3:
                    continue
                pair_key = tuple(sorted([t_a, t_b]))
                if pair_key in csv_db:
                    match = csv_db[pair_key]
                    level = match["level"]
                    return {
                        "drugA": med_a_raw,
                        "drugB": med_b_raw,
                        "severity": "CRITICAL" if level.lower() == "major" else "MODERATE",
                        "level": level,
                        "category": "DDInter Clinical Evidence",
                        "title": f"Interaction Detected ({level}): {match['drugA']} + {match['drugB']}",
                        "mechanism": f"Documented pharmacological interaction in DDInter evidence database between {match['drugA']} and {match['drugB']}.",
                        "recommendation": f"Monitor patient response closely or adjust administration timing/dosage if co-prescribing {med_a_raw} and {med_b_raw}.",
                        "isClinicalRule": False
                    }

    return None


def evaluate_drug_interactions(medicines):
    """
    Evaluates all pairwise combinations of medicines in a prescription list.
    Returns:
    - interactions: list of rich interaction objects
    - validations: list of validation messages for frontend / API response
    """
    interactions = []
    validations = []

    valid_meds = [m for m in medicines if m and (isinstance(m, dict) and m.get("name") or isinstance(m, str) and m.strip())]
    if len(valid_meds) < 2:
        return {
            "hasInteractions": False,
            "hasCriticalInteractions": False,
            "interactions": [],
            "validations": []
        }

    seen_pairs = set()

    for i in range(len(valid_meds)):
        for j in range(i + 1, len(valid_meds)):
            med_a = valid_meds[i]
            med_b = valid_meds[j]

            name_a = med_a.get("name", "").strip() if isinstance(med_a, dict) else str(med_a).strip()
            name_b = med_b.get("name", "").strip() if isinstance(med_b, dict) else str(med_b).strip()

            if not name_a or not name_b:
                continue

            pair_id = tuple(sorted([name_a.lower(), name_b.lower()]))
            if pair_id in seen_pairs:
                continue
            seen_pairs.add(pair_id)

            compounds_a = med_a.get("activeCompounds", []) if isinstance(med_a, dict) else []
            compounds_b = med_b.get("activeCompounds", []) if isinstance(med_b, dict) else []

            result = check_single_pair(name_a, name_b, compounds_a, compounds_b)
            if result:
                interactions.append(result)

                is_critical = result["severity"] == "CRITICAL"
                icon = "🚨" if is_critical else "⚠️"
                validations.append({
                    "type": "error" if is_critical else "warning",
                    "severity": result["severity"],
                    "drugA": result["drugA"],
                    "drugB": result["drugB"],
                    "title": result["title"],
                    "message": f"{icon} DRUG INTERACTION ({result['severity']}): {result['drugA']} + {result['drugB']} — {result['title']}. {result['mechanism']} Recommendation: {result['recommendation']}",
                    "details": result
                })

    has_critical = any(item["severity"] == "CRITICAL" for item in interactions)

    return {
        "hasInteractions": len(interactions) > 0,
        "hasCriticalInteractions": has_critical,
        "interactions": interactions,
        "validations": validations
    }
