# Indian Crime Intelligence & Case Relationship Discovery Portal

[![Backend Tests](https://img.shields.io/badge/pytest-23%20passed-brightgreen.svg)]()
[![Dataset](https://img.shields.io/badge/Dataset-40%2C160%20Real%20Records-blue.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-blue.svg)]()
[![React](https://img.shields.io/badge/React-18-cyan.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)]()
[![Vite](https://img.shields.io/badge/Vite-6.0+-purple.svg)]()
[![Cytoscape](https://img.shields.io/badge/Cytoscape.js-Graph%20Engine-orange.svg)]()

A state-of-the-art decision-support platform and investigative case-intelligence portal. Powered by a **real Indian Crime Dataset of 40,160 incident records** across **29 municipal police jurisdictions**.

The system automatically discovers meaningful multi-attribute, temporal, geographical, demographic, and tactical relationships across real crime records—transforming structured data into an explainable, multi-relational knowledge graph without fabricating synthetic personas, vehicles, or GPS coordinates.

---

## Table of Contents
1. [Core Platform Capabilities](#core-platform-capabilities)
2. [Dataset Provenance & Schema](#dataset-provenance--schema)
3. [System Architecture & Pipeline](#system-architecture--pipeline)
4. [Data-Driven Relationship Engine](#data-driven-relationship-engine)
5. [Interactive Knowledge Graph](#interactive-knowledge-graph)
6. [Empirical Patterns & Anomaly Discovery](#empirical-patterns--anomaly-discovery)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Setup & Running Locally](#setup--running-locally)
9. [Investigative Ethics & Responsible AI](#investigative-ethics--responsible-ai)
10. [Future Extensibility (Phase 3 FIR OCR/NLP)](#future-extensibility-phase-3-fir-ocrnlp)

---

## Core Platform Capabilities

- **Real Indian Crime Foundation**: Ingests, normalizes, and indexes **40,160 genuine public incident records** from Indian law enforcement reports.
- **Strict Data Integrity**: Absolutely **zero fabricated entities**. No fake suspects, no artificial witness names, no simulated license plates, and no invented GPS coordinates.
- **Multi-Attribute Inverted Indexing**: Sub-second candidate generation across 40,160 cases using inverted indices for municipal jurisdictions, crime codes, domains, and tactical weapons.
- **Explainable Relationship Scoring**: Every discovered relationship provides calibrated confidence scores, score breakdowns across 9 features, and human-readable evidence bullets.
- **Bounded Incident Ego-Graphs**: High-performance interactive visualization rendering focal case nodes connected to verified dimensions (`CITY`, `CRIME`, `CRIME_DOMAIN`, `WEAPON`) and top correlated incident profiles.
- **Empirical Recurrent Patterns**: Autonomous mining of recurring tactical signatures (crime type + weapon + city + time window).
- **Investigation Anomaly Detection**: Statistical outlier detection for prolonged closure durations, law enforcement mobilization surges, and reporting timeline discrepancies.
- **Enterprise-Grade UI**: Built with React 18, TypeScript, Cytoscape.js, Lucide Icons, and Vanilla CSS with pagination, global search, and dynamic telemetry.

---

## Dataset Provenance & Schema

- **Source File**: `data/real/indian_crime_cases_real_cleaned.json` (also mirrored at `./indian_crime_cases_real_cleaned.json`)
- **Total Records**: **40,160 real cases**
- **Dimension Catalogs**:
  - **Cities (29)**: Ahmedabad, Bangalore, Chennai, Delhi, Hyderabad, Jaipur, Kolkata, Mumbai, Pune, Surat, Lucknow, Kanpur, etc.
  - **Crime Types (21)**: Robbery, Burglary, Cybercrime, Assault, Extortion, Fraud, Identity Theft, etc.
  - **Weapons (6 Categories)**: Firearm, Sharp Weapon, Blunt Object, Chemical, Cyber, Unspecified / Physical Force.
  - **Crime Domains (4)**: Property Crime, Violent Crime, Financial / Cyber Crime, Public Order.
- **Canonical Stable IDs**: `IND-CASE-00001` through `IND-CASE-40160` (deterministic and preserved across server restarts).
- **Original Report Trackers**: Preserved in `source.source_report_number` (100% unique).

For detailed schema documentation, see [DATASET.md](file:///c:/Users/ABHISHEK/OneDrive/Desktop/major%20project/DATASET.md).

---

## System Architecture & Pipeline

```text
┌─────────────────────────────────────────────────────────────┐
│             REAL INDIAN CRIME DATASET (40,160 Cases)        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 1. VALIDATION & NORMALIZATION               │
│   • CaseDataProvider abstraction (IndianCrimeJsonProvider)  │
│   • Time & Date parsing (ISO 8601, 24h circular hour)       │
│   • Dimensional normalization (cities, crime codes, domains)│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              2. INVERTED MULTI-INDEXING & RETRIEVAL         │
│   • City index  • Crime Code index  • Weapon index          │
│   • Domain index • Compound (City, Crime Code) index        │
│   • Sub-millisecond candidate retrieval (200 candidates)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            3. DATA-DRIVEN RELATIONSHIP SCORING ENGINE       │
│   • Same Municipal Jurisdiction (w = 0.20)                  │
│   • Statutory Crime Code Concordance (w = 0.25)             │
│   • Crime Description Similarity (w = 0.15)                 │
│   • Crime Domain Alignment (w = 0.08)                       │
│   • Weapon Category Alignment (w = 0.18)                    │
│   • Continuous Exponential Temporal Decay (w = 0.15)        │
│   • Circular 24h Clock Time Window (w = 0.10)               │
│   • Victim Demographic Concordance (w = 0.10)               │
│   • TF-IDF Semantic Profile Similarity (w = 0.12)           │
│   • Multi-Attribute Compound Boost & IDF Rarity Multiplier   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 4. EXPLAINABLE EVIDENCE SYNTHESIS           │
│   Generates clear, transparent reasons:                     │
│   "Similar Incident Profile" — NEVER "Same Criminal"        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            5. KNOWLEDGE GRAPH & ANALYTICAL PORTAL           │
│   • Bounded Case Ego-Graphs (City, Crime, Weapon, Domain)   │
│   • Paginated Case Catalog (50/page)                        │
│   • Real-Time Statistics & Dimension Catalogs               │
│   • Discovered Patterns & Investigation Outliers            │
└─────────────────────────────────────────────────────────────┘
```

---

## Data-Driven Relationship Engine

Because personal identifiers are not present in public crime data, relationships represent **similar incident profiles** rather than assertions of identity:

### Scoring Breakdown
$$\text{Score} = \left(\sum w_i \cdot f_i + \text{CompoundBoost}\right) \times \text{RarityMultiplier}$$

1. **Municipal Jurisdiction ($w = 0.20$)**: 1.0 if both incidents occurred in the same city; 0.0 otherwise.
2. **Crime Code Match ($w = 0.25$)**: 1.0 for exact statutory offense code match.
3. **Crime Description ($w = 0.15$)**: 1.0 for matching offense title.
4. **Crime Domain ($w = 0.08$)**: 1.0 for same legal category (e.g., Property Crime).
5. **Weapon Alignment ($w = 0.18$)**: 1.0 for matching weapon category.
6. **Temporal Proximity ($w = 0.15$)**: Continuous exponential decay $\exp(-\Delta t / 14.0)$.
7. **Time-of-Day Proximity ($w = 0.10$)**: Circular 24-hour distance $(1.0 - \text{diff} / 4.0)$ for $\text{diff} \le 4\text{h}$.
8. **Victim Demographic ($w = 0.10$)**: Concordance in victim gender and age band.
9. **Semantic Similarity ($w = 0.12$)**: Cosine similarity across structured profile descriptors.
10. **Compound Boost ($+0.12$)**: Awarded when 3+ structural features match simultaneously.
11. **IDF Rarity Multiplier ($0.92 \to 1.16$)**: Boosts rare crime codes or uncommon weapon categories.

---

## Dual Graph Architecture

The portal provides **two distinct, complementary knowledge graph modes**:

### 1. Case Network (Cross-Case Relationships)
Answers: *"How is this case related to other cases across jurisdictions and time?"*
- **Dataset**: `data/real/indian_crime_cases_real_cleaned.json` (40,160 real public records).
- **Graph Type**: Multi-case ego-network.
- **Node Dimensions**: Focal Case node, correlated Cases, Cities, Crime Codes, Crime Domains, Weapons.
- **Edge Types**: `similar_incident_profile`, `same_city`, `same_weapon`, `temporal_proximity`.

### 2. Case Intelligence Graph (Single-Case Entity Graph)
Answers: *"What people, locations, objects, weapons, vehicles, evidence and events are connected to this particular case?"*
- **Dataset**: `data/synthetic/indian_detailed_case_entity_dataset.json` (15 detailed synthetic demonstration records simulating future document-upload and text-extraction pipelines).
- **Core Node Types**:
  - `CASE`: Central root anchor node.
  - `PERSON`: With explicit roles (`victim`, `suspect`, `witness`, `associate`).
  - `LOCATION`: Incident locus (`crime_scene`, `last_known_movement`).
  - `WEAPON`: Recovered or tied weapons (`knife`, `firearm`, `blunt_object`).
  - `VEHICLE`: Associated vehicles with visible license registrations (e.g. `MH-03-KR-4821`).
  - `OBJECT`: Material items and personal property.
  - `EVENT`: Chronological incident events (`argument`, `assault`, `vehicle_departure`).
  - `EVIDENCE`: Forensic tags linked to physical weapons, objects, and CCTV.
- **Synchronized Timeline Panel**: Integrated chronological timeline; clicking an event spotlights its connected entities in the graph and vice-versa.
- **Explainable Edges**: Explains why every edge exists, distinguishing structured **EXPLICIT** facts from algorithmically **DERIVED** progressions.
- **Future Extensibility**: Uses abstract provider interface `CaseEntityGraphProvider` ready for seamless connection to `DocumentExtractionService`.

---

## API Endpoints Reference

### Case Intelligence (Single-Case Entity Graph)
- `GET /api/intelligence-cases`: Lists available synthetic demo cases with dynamic entity counts and summaries.
- `GET /api/intelligence-cases/{case_id}/graph?depth=full`: Fetches entity-level nodes, explicit/derived edges, and chronological timeline for a case (`depth`: `direct`, `two_levels`, `full`).

### Cases & Case Network (Multi-Case Discovery)
- `GET /api/cases?page=1&page_size=50`: Paginated case catalog with filtering by city, crime description, domain, weapon, and status.
- `GET /api/cases/{case_id}`: Full incident dossier with victim profile, weapon, investigation status, and provenance.
- `GET /api/cases/{case_id}/relationships?min_confidence=0.35&limit=20`: Ranked related cases with multi-factor evidence.
- `GET /api/graph?center_id={case_id}&max_related=15&min_confidence=0.35`: Bounded multi-case ego-subgraph for visualization.
- `GET /api/cases/{case_a_id}/relationship-debug/{case_b_id}`: Detailed mathematical breakdown and feature vector between any pair.

### Search & Dimensions
- `GET /api/search?q={term}`: Unified search across cases, cities, crime descriptions, and weapons.
- `GET /api/entities/cities`: Catalog of 29 cities with case counts, closure rates, and top crimes.
- `GET /api/entities/crimes`: Catalog of 21 statutory crime descriptions.
- `GET /api/entities/weapons`: Catalog of 6 tactical weapon categories.
- `GET /api/entities/domains`: Catalog of 4 legal crime domains.

### Analytics & System
- `GET /api/stats`: Dynamic dashboard counts (total cases, closure rate, active cities, etc.).
- `GET /api/analytics`: Aggregated distributions by city, month, year, weapon, and victim demographics.
- `GET /api/patterns`: Empirically discovered recurrent tactical incident patterns.
- `GET /api/anomalies`: Statistical outliers in closure duration, reporting delay, and police deployment.
- `GET /api/health`: System health and dataset readiness telemetry.
- `POST /api/analysis/rebuild`: Recomputes derived relationships, patterns, and indices.

---

## Setup & Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend
```bash
# Navigate to project root
cd "major project"

# Install dependencies
pip install fastapi uvicorn pydantic scikit-learn networkx python-dateutil pytest httpx

# Run tests
python -m pytest backend/tests -v

# Start FastAPI server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Build production bundle to verify types
npm run build

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Investigative Ethics & Responsible AI

1. **No False Perpetrator Attribution**: The portal clearly articulates that relationships denote **similar incident profiles**, never identical suspects.
2. **Verifiable Data**: All insights are derived strictly from empirical records. Missing values are preserved as `None` or `Unspecified` rather than synthesized.
3. **Transparent Mathematical Scoring**: Every score can be audited via the debug API, showing raw weights, feature values, and evidence rationale.

---

## Future Extensibility (Phase 3 FIR OCR/NLP)

The backend utilizes the `CaseDataProvider` abstraction:
- Current: `IndianCrimeJsonProvider` (loading cleaned structured records).
- Phase 3: `DocumentExtractionProvider` (ingesting raw First Information Report PDFs, running OCR and NER entity extraction, and feeding the resulting `CaseModel` into the exact same relationship engine).
