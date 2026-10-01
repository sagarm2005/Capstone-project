import requests
import logging
import re
from medicine_service import get_medicine_price_details

# Common drug class cross-reactivity rules
DRUG_CLASSES = {
    "penicillin": [
        "penicillin", "penicillium", "amoxicillin", "ampicillin", "clavulanic", "clavulanate",
        "piperacillin", "ticarcillin", "oxacillin", "cloxacillin", "dicloxacillin", "amoxycillin", "augmentin"
    ],
    "cephalosporin": [
        "cephalosporin", "cefixime", "ceftriaxone", "cefuroxime", "cephalexin", "cefazolin",
        "cefpodoxime", "cefprozil", "cefepime"
    ],
    "sulfonamide": [
        "sulfa", "sulfonamide", "sulfamethoxazole", "trimethoprim", "bactrim", "septra",
        "sulfadiazine", "sulfasalazine"
    ],
    "nsaid": [
        "nsaid", "aspirin", "ibuprofen", "naproxen", "diclofenac", "ketorolac",
        "mefenamic", "indomethacin", "piroxicam", "etoricoxib", "celecoxib", "combiflam"
    ],
    "macrolide": [
        "macrolide", "azithromycin", "clarithromycin", "erythromycin", "roxithromycin"
    ],
    "fluoroquinolone": [
        "fluoroquinolone", "quinolone", "ciprofloxacin", "levofloxacin", "ofloxacin",
        "norfloxacin", "moxifloxacin"
    ],
    "paracetamol": [
        "paracetamol", "acetaminophen", "crocin", "calpol", "dolo", "pacimol"
    ]
}

def query_healthpilot_api(drug_query):
    """
    Calls HealthPilot API (Drug Information Service) at https://drugdb.in/search?q={query}&detail=full
    """
    clean_q = drug_query.strip()
    if not clean_q:
        return None
        
    url = f"https://drugdb.in/search?q={requests.utils.quote(clean_q)}&detail=full"
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and data:
                return data
            if isinstance(data, dict):
                return data.get("results", data.get("data", []))
    except Exception as e:
        logging.warning(f"HealthPilot API lookup for '{drug_query}' error: {e}")
        
    return None

def check_allergy_against_compounds(patient_allergies, active_compounds, drug_name=""):
    """
    Cross-checks patient allergies against active compounds and drug name.
    Returns: { "hasConflict": bool, "alerts": [...] }
    """
    alerts = []
    
    if not patient_allergies:
        return {"hasConflict": False, "alerts": []}
        
    normalized_allergies = [a.strip().lower() for a in patient_allergies if a and a.strip()]
    normalized_compounds = [c.strip().lower() for c in active_compounds if c and c.strip()]
    
    # 1. Direct name match between active compounds and patient allergies
    for compound in normalized_compounds:
        for allergy in normalized_allergies:
            if allergy in compound or compound in allergy:
                alerts.append({
                    "patientAllergy": allergy.title(),
                    "conflictingCompound": compound.title(),
                    "reason": f"Direct allergy conflict: Patient is allergic to '{allergy.title()}', which is an active compound in this medicine."
                })
                
    # 2. Check drug name directly against patient allergies
    clean_drug_name = drug_name.strip().lower()
    for allergy in normalized_allergies:
        if allergy in clean_drug_name or clean_drug_name in allergy:
            if not any(a["patientAllergy"].lower() == allergy for a in alerts):
                alerts.append({
                    "patientAllergy": allergy.title(),
                    "conflictingCompound": clean_drug_name.title(),
                    "reason": f"Patient has documented allergy matching medicine name '{allergy.title()}'."
                })

    # 3. Class cross-reactivity checks
    for group_name, drugs_in_group in DRUG_CLASSES.items():
        # Check if patient allergy falls into this group
        allergy_match = any(
            any(item in allergy for item in drugs_in_group) or any(allergy in item for item in drugs_in_group)
            for allergy in normalized_allergies
        )
        if allergy_match:
            # Find which patient allergy matched
            matching_allergy = next(
                (allergy for allergy in normalized_allergies if any(item in allergy for item in drugs_in_group) or any(allergy in item for item in drugs_in_group)),
                group_name
            )
            
            # Check if any active compound or drug name falls into this group
            for compound in normalized_compounds:
                if any(item in compound for item in drugs_in_group):
                    if not any(a["patientAllergy"].lower() == matching_allergy.lower() and a["conflictingCompound"].lower() == compound for a in alerts):
                        alerts.append({
                            "patientAllergy": matching_allergy.title(),
                            "conflictingCompound": compound.title(),
                            "reason": f"Cross-reactivity warning: '{compound.title()}' belongs to the {group_name.title()} class, matching patient allergy '{matching_allergy.title()}'."
                        })
            
            if any(item in clean_drug_name for item in drugs_in_group):
                if not any(a["patientAllergy"].lower() == matching_allergy.lower() for a in alerts):
                    alerts.append({
                        "patientAllergy": matching_allergy.title(),
                        "conflictingCompound": clean_drug_name.title(),
                        "reason": f"Cross-reactivity warning: '{clean_drug_name.title()}' belongs to the {group_name.title()} class, matching patient allergy '{matching_allergy.title()}'."
                    })

    return {
        "hasConflict": len(alerts) > 0,
        "alerts": alerts
    }

def analyze_prescribed_medicine(medicine_name, patient_allergies=None):
    """
    Complete analysis for a prescribed medicine:
    1. HealthPilot.ai API: Retrieves active compounds, composition, generic medicine record.
    2. Allergy Check: Flags conflict and triggers RED status if allergy detected.
    3. Generic Check: If no allergy, identifies generic medicine and enables add-generic option.
    4. Indian Medicine Dataset: Looks up real price from indian_medicine_data.json.
    """
    clean_name = medicine_name.strip()
    if not clean_name:
        return None
        
    hp_data = query_healthpilot_api(clean_name)
    
    active_compounds = []
    generic_name = None
    generic_dose = None
    contraindications = ""
    indications = ""
    brand_name = clean_name
    
    if hp_data and len(hp_data) > 0:
        top_result = hp_data[0]
        brand_name = (top_result.get("brand") or {}).get("brandName") or top_result.get("medicineName") or clean_name
        
        # Generic info
        generic_detail = top_result.get("genericDetail") or {}
        generic_info = top_result.get("generic") or {}
        generic_name = generic_info.get("genericName") or generic_detail.get("name")
        generic_dose = generic_detail.get("doseForm", "")
        contraindications = generic_detail.get("contraIndications", "")
        indications = generic_detail.get("indications", "")
        
        # Extract composition active compounds
        composition = generic_detail.get("composition") or []
        for comp in composition:
            substance = comp.get("substanceName")
            strength = comp.get("strength")
            unit = comp.get("unit")
            if substance:
                active_compounds.append(substance)

    # Fallback extraction from name or pricing dataset if HealthPilot had empty compounds
    price_info = get_medicine_price_details(clean_name)
    if not active_compounds and price_info.get("composition"):
        comps = price_info["composition"].split("+")
        for c in comps:
            cleaned = re.sub(r'\(.*?\)', '', c).strip()
            if cleaned:
                active_compounds.append(cleaned)
                
    if not generic_name and active_compounds:
        generic_name = " + ".join(active_compounds)

    # 2. Allergy Check
    allergy_check = check_allergy_against_compounds(
        patient_allergies or [],
        active_compounds,
        clean_name
    )
    
    # 3. Generic Info and Pricing
    generic_available = bool(generic_name and generic_name.lower().strip() != clean_name.lower().strip())
    generic_price_info = None
    if generic_name:
        generic_price_info = get_medicine_price_details(generic_name)

    return {
        "medicineName": clean_name,
        "brandName": brand_name,
        "activeCompounds": active_compounds,
        "allergyCheck": allergy_check,
        "hasAllergyConflict": allergy_check["hasConflict"],
        "generic": {
            "available": generic_available,
            "genericName": generic_name,
            "doseForm": generic_dose,
            "price": generic_price_info["price"] if generic_price_info else round(price_info["price"] * 0.45, 2),
            "packSize": (generic_price_info or {}).get("packSize", "Standard Pack"),
            "manufacturer": (generic_price_info or {}).get("manufacturer", "Generic Formulation")
        },
        "pricing": {
            "name": price_info["name"],
            "price": price_info["price"],
            "manufacturer": price_info.get("manufacturer", "Pharma Ltd"),
            "packSize": price_info.get("packSize", "1 pack"),
            "foundInDataset": price_info.get("found", False)
        },
        "indications": indications,
        "contraindications": contraindications
    }
