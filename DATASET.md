# Real Indian Crime Dataset Specification & Provenance

## 1. Overview & Provenance

This portal operates on a genuine public Indian crime dataset containing **40,160 structured incident records** across **29 municipal police jurisdictions**.

- **Dataset Identifier**: `indian_crime_cases_real_cleaned.json`
- **Source**: Public Indian Crime Dataset provided by the project team.
- **Data Type**: Public Crime Incident Records.
- **Synthetic Records in Primary Dataset**: **0 (None)**. The previous development-only synthetic 120-case dataset (`crime_intelligence_dataset_120_cases.json`) has been completely removed from active service.
- **Application Case Identifier**: Canonical, stable identifier format `IND-CASE-00001` through `IND-CASE-40160` (deterministic and preserved across server restarts).
- **Original Source Identifier**: Preserved in `source.source_report_number` (100% unique across all 40,160 cases).

---

## 2. Dataset Schema & Structured Fields

Each record conforms to the following strict Pydantic model hierarchy:

### Core Case Structure
- `case_id` (string): Stable unique key, e.g., `IND-CASE-00001`.
- `source`:
  - `dataset` (string): Name of originating dataset.
  - `source_file` (string): Underlying source file path.
  - `source_report_number` (int): Original FIR / police report tracking number.
  - `data_type` (string): Public dataset provenance tag.
- `incident`:
  - `crime_code` (int): Statutory crime classification code under the Indian legal classification system (e.g. `354`, `302`, `379`, `420`).
  - `crime_description` (string): Specific statutory description (e.g., *Burglary*, *Robbery*, *Cyber Fraud*, *Extortion*).
  - `crime_domain` (string): Broad legal domain (*Property Crime*, *Violent Crime*, *Financial/Cyber Crime*, *Public Order*).
  - `date_of_occurrence` (string | null): Incident occurrence date (`YYYY-MM-DD`).
  - `date_reported` (string): Date of official registration at the police station.
  - `time_of_occurrence` (string | null): Exact timestamp or timestamp with hour and minute.
- `location`:
  - `city` (string): Municipal jurisdiction / police district (one of 29 major Indian urban centers).
- `victim`:
  - `age` (int | null): Age in years.
  - `age_band` (string | null): Demographic bracket (e.g., `18-25`, `26-35`, `36-50`, `51+`).
  - `gender` (string | null): Recorded victim gender (`Male`, `Female`, `Transgender`, `Unspecified`).
- `weapon`:
  - `used` (string | null): Specific weapon designation or `None` if unarmed/unrecorded.
- `investigation`:
  - `police_deployed` (int | null): Number of law enforcement personnel mobilized.
  - `case_closed` (bool): Boolean flag denoting official case closure.
  - `date_case_closed` (string | null): Resolution date (`null` for active/open investigations).
  - `closure_duration_days` (int | null): Duration in days from report to formal closure.
- `derived_features`:
  - `occurrence_year`, `occurrence_month`, `occurrence_month_name`, `occurrence_day_of_week`, `occurrence_hour`, `occurrence_minute`.
  - `report_delay_hours`: Time elapsed between occurrence and police reporting.
  - `semantic_text`: Structured natural language profile summary for TF-IDF / vector semantic reasoning.
  - Normalized keys: `city_key`, `crime_key`, `crime_domain_key`, `weapon_key`.
- `graph_entities`:
  - `case_node`, `city_node`, `crime_node`, `domain_node`, `weapon_node`.

---

## 3. Dimensional Dimension Tables

The dataset includes 4 comprehensive dimension lookup catalogs:
1. **Cities (29)**: Major metropolitan and municipal police jurisdictions including Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Ahmedabad, Pune, Surat, Jaipur, Lucknow, Kanpur, etc.
2. **Statutory Crime Classifications (21)**: Standard statutory offenses covering theft, assault, extortion, financial cyberfraud, burglary, homicide, etc.
3. **Tactical Weapons (6 Categories)**: Firearm, Sharp Weapon, Blunt Weapon, Chemical / Hazardous Substance, Cyber Instrument, Unspecified / Physical Force.
4. **Crime Domains (4 Categories)**: Property Crime, Violent Crime, Cyber & Financial Crime, Public Order.

---

## 4. Explicitly Excluded & Missing Entities (No Fabricated Data)

In strict accordance with empirical research standards and investigative ethics:

1. **NO Personal Identities**: The public dataset does not contain suspect names, national IDs, or persistent criminal identifiers. **We do NOT invent fake suspects or artificial persons (`P001`, `John Doe`).**
2. **NO Witness Identities**: The dataset contains no witness depositions or witness registry. We do NOT simulate artificial witness statements.
3. **NO Vehicle Registrations**: Vehicle licence plates and VINs do not exist in this dataset. We do NOT fabricate fake vehicle registrations.
4. **NO Invented GPS Coordinates**: The dataset does not provide telemetry or latitude/longitude coordinates. We do NOT synthesize random coordinates. Geographic relationships operate strictly at municipal city / police district jurisdiction levels.
5. **NO Fabricated FIR Narratives**: Modus operandi and semantic reasoning are derived solely from actual incident parameters, legal classifications, and structured profiles.

---

## 5. Relationship Discovery Methodology

Because personal identifiers are not present, relationships represent **similar incident profiles**—**NEVER an assertion that the same individual committed the offenses**.

The relationship discovery engine calculates multi-attribute concordance across:
1. **Municipal Jurisdiction Alignment** ($w = 0.20$): Incidents occurring within the same urban police jurisdiction.
2. **Statutory Crime Code Concordance** ($w = 0.25$): Exact match on statutory penal offense.
3. **Crime Description Similarity** ($w = 0.15$): Offense title alignment.
4. **Crime Domain Alignment** ($w = 0.08$): Shared legal classification domain.
5. **Tactical Weapon Alignment** ($w = 0.18$): Concordance on weapon type deployed.
6. **Temporal Proximity** ($w = 0.15$): Continuous exponential decay modeling:
   $$\text{score}_{\text{temporal}} = \exp\left(-\frac{\Delta t \ln 2}{\tau}\right)$$
   where $\Delta t$ is days elapsed and $\tau = 14$ days half-life.
7. **Time-of-Day Window** ($w = 0.10$): Circular 24-hour clock distance:
   $$\text{diff} = \min(|h_1 - h_2|, 24 - |h_1 - h_2|)$$
8. **Victim Demographic Concordance** ($w = 0.10$): Alignment in victim age band and gender.
9. **Semantic Incident Profile Similarity** ($w = 0.12$): TF-IDF cosine similarity across natural incident profiles.
10. **Compound Incident Profile Boost**: Synergy bonus when 3 or more structural attributes align simultaneously (e.g. same city + same crime code + same weapon category + nearby date).

---

## 6. Future Extensible Document-Extraction Architecture

The system is architected around the `CaseDataProvider` abstract interface:

```text
CaseDataProvider (Interface)
       ├── IndianCrimeJsonProvider (Active - 40,160 Cleaned Records)
       └── DocumentExtractionProvider (Phase 3 Extension)
```

In Phase 3, unstructured First Information Reports (FIRs) and charge-sheet PDFs will be ingested via:
```text
FIR PDF / Scanned Document
          ↓
OCR & Text Extraction
          ↓
NLP Entity & Tactical Feature Extraction
          ↓
Standardized CaseModel Object
          ↓
Same Core Relationship Engine & Knowledge Graph
```

The relationship engine is decoupled from the ingestion mechanism, ensuring seamless transition between tabular public data and extracted document dossiers.
