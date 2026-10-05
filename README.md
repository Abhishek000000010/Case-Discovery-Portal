# Crime Intelligence & Case Relationship Discovery Portal

[![Backend Tests](https://img.shields.io/badge/pytest-43%20passed-brightgreen.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-blue.svg)]()
[![React](https://img.shields.io/badge/React-18-cyan.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)]()
[![Vite](https://img.shields.io/badge/Vite-6.0+-purple.svg)]()
[![Cytoscape](https://img.shields.io/badge/Cytoscape.js-Graph%20Engine-orange.svg)]()

A state-of-the-art academic decision-support prototype and investigative case-intelligence portal. Designed to automatically discover meaningful direct, indirect, semantic, temporal, geographical, behavioural, and entity-based relationships across complex crime incident records—transforming fragmented data into an explainable, multi-relational knowledge graph without hardcoded heuristic scenarios.

---

## Table of Contents
1. [Project Vision & Objective](#project-vision--objective)
2. [What We Have Accomplished Till Now](#what-we-have-accomplished-till-now)
   - [Phase 1: Foundation & Core Platform (MVP)](#phase-1-foundation--core-platform-mvp)
   - [Phase 2: Semantic Reasoning & Explainability Engine](#phase-2-semantic-reasoning--explainability-engine)
3. [System Architecture & Pipeline](#system-architecture--pipeline)
4. [Core Intelligence Modules & Algorithms](#core-intelligence-modules--algorithms)
   - [1. Multi-Signal Candidate Generation](#1-multi-signal-candidate-generation)
   - [2. Multi-Metric Feature Extraction](#2-multi-metric-feature-extraction)
   - [3. Modus Operandi Vector Concordance](#3-modus-operandi-vector-concordance)
   - [4. Event Sequence Alignment (LCS)](#4-event-sequence-alignment-lcs)
   - [5. Continuous Temporal Decay Modeling](#5-continuous-temporal-decay-modeling)
   - [6. Multi-Bracket Geographic Reasoning](#6-multi-bracket-geographic-reasoning)
   - [7. Entity Disambiguation & Canonicalization](#7-entity-disambiguation--canonicalization)
   - [8. Inverse Document Frequency (IDF) Rarity Scoring](#8-inverse-document-frequency-idf-rarity-scoring)
   - [9. Multi-Hop Graph Traversal & Indirect Relationships](#9-multi-hop-graph-traversal--indirect-relationships)
   - [10. Agglomerative Case Clustering](#10-agglomerative-case-clustering)
   - [11. 5-Vector Anomaly Detection](#11-5-vector-anomaly-detection)
   - [12. Probabilistic "Next Signals" Recommendation](#12-probabilistic-next-signals-recommendation)
5. [Frontend Portal & User Experience](#frontend-portal--user-experience)
6. [Benchmark Evaluation & Ground-Truth Verification](#benchmark-evaluation--ground-truth-verification)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Project Structure](#project-structure)
9. [Installation & Local Run Guide](#installation--local-run-guide)
10. [Safety, Ethics & Neutrality Protocol](#safety-ethics--neutrality-protocol)
11. [Roadmap for Phase 3](#roadmap-for-phase-3)

---

## Project Vision & Objective

Traditional Law Enforcement and Investigative software typically functions as a basic database management system with keyword lookups or rigid SQL query filters. Real-world investigations require discovering hidden patterns across disparate incidents:

> **Objective:** Given a collection of structured crime case records, automatically discover direct, indirect, semantic, temporal, geographical, behavioural, and entity-based relationships; explain with complete mathematical transparency *why* those relationships exist; represent them in an interactive knowledge graph; and surface tactical patterns and recurrence anomalies without asserting unsupported conclusions.

---

## What We Have Accomplished Till Now

### Phase 1: Foundation & Core Platform (MVP)
In the initial development phase, we built the foundational data models, server infrastructure, and visual interface:
- **Comprehensive Synthetic Dataset**: Synthesized 120 rich crime cases spanning multiple domains: residential burglary, armed commercial robbery, vehicle theft, cyber phishing & ATM skimming, missing persons, narcotics distribution, extortion, and homicide.
- **Pydantic 2 Domain Models**: Developed strict schemas for Cases, Entities (Persons, Vehicles, Locations, Objects), Timeline Events, Physical/Digital Evidence, and Modus Operandi specifications.
- **FastAPI Backend Server**: Built asynchronous REST endpoints with schema validation, CORS middleware, and in-memory indexing.
- **Cytoscape Knowledge Graph**: Visualized relationships between cases and entities with interactive layouts, filtering, and node details.
- **Modern Minimalist UI**: Built with React 18, TypeScript, and pure CSS (zero heavy CSS framework bloat). Designed with a clean, high-contrast, professional palette tailored for analytical clarity.

---

### Phase 2: Semantic Reasoning & Explainability Engine
In Phase 2, we completely transformed the relationship engine from a basic field-matching application into a genuine **semantic and logical reasoning engine**:
- **Eliminated All Hardcoded Scenarios**: Removed arbitrary `if case_type == "missing_person" and ...` rules. Relationships are now discovered strictly through underlying physical, temporal, spatial, behavioral, and lexical evidence.
- **Layered 8-Stage Inference Pipeline**: Decoupled ingestion, normalization, candidate filtering, feature extraction, rarity calibration, classification, explanation, and graph assembly.
- **Forensic Modus Operandi (MO) Comparison**: Structured extraction of matching tactical tokens vs. differing tactics.
- **Longest Common Subsequence (LCS) Event Sequences**: Captures tactical chronological progression regardless of timing variations.
- **Continuous Temporal Decay Functions**: Replaced arbitrary day buckets with smooth exponential decay curves.
- **Haversine Distance Bands**: Implemented calibrated spatial proximity bands for precise geographical reasoning.
- **Entity Disambiguation Engine**: Fuzzy name and alias resolution ("Rohan Mehta" $\leftrightarrow$ "R. Mehta") and license plate canonicalization ("MH-04-AB-2187" $\leftrightarrow$ "MH04AB2187").
- **Inverse Document Frequency (IDF) Feature Rarity**: Rewards shared rare identifiers while discounting ubiquitous tags like `theft`.
- **Indirect Path Traversal**: Multi-hop BFS algorithms to uncover 2nd- and 3rd-degree connection chains (e.g. `Case A → Person X → Case B → Location L → Case C`).
- **Agglomerative Case Clustering**: Groups multi-case series based on joint spatial-temporal and behavioral vectors.
- **Probabilistic "Next Signals" Engine**: Surfaces historical transition patterns to suggest prospective locations and tactical phases for review.
- **5-Vector Statistical Anomaly Detection**: Tracks person recurrence, vehicle recurrence, spatial hotspots, behavioral outliers, and reporting timeline discrepancies.
- **Live Debug & Inspection Engine**: Created `GET /api/cases/{case_id}/relationship-debug/{target_case_id}` exposing raw feature vectors, weights, threshold decisions, and natural-language evidence.
- **Deep Diagnostic Drawer & Modal**: Frontend interface displaying exact matching vs. differing MO tactics, LCS event sequences, multi-dimensional feature gauges, and live backend telemetry.
- **Strict Isolated Benchmark**: 43 automated tests ensuring 92.7% recall, 89.5% precision, and 100% negative-control specificity with zero data leakage.

---

## System Architecture & Pipeline

```text
┌─────────────────────────────────────────────────────────────┐
│                 CRIME CASE DATA (120 Cases)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               1. NORMALIZATION & PREPROCESSING               │
│   • Alias Resolution  • Plate Sanitization  • Text Cleaning  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              2. MULTI-SIGNAL CANDIDATE GENERATION            │
│   Filters N×N space using 5 independent signals:             │
│   • Shared Entities  • Spatial Bands  • Temporal Decay      │
│   • Modus Operandi Concordance  • Semantic Lexical Overlap   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             3. MULTI-METRIC FEATURE EXTRACTION              │
│   Extracts 15+ quantitative indicators into                  │
│   RelationshipFeatures vector                                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│         4. IDF RARITY & EVIDENCE-QUALITY WEIGHTING          │
│   • Rare identifiers boosted by Inverse Case Frequency       │
│   • Common generic tokens penalized                          │
│   • Direct physical IDs prioritised over lexical similarity │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             5. CALIBRATED SCORING & CLASSIFICATION          │
│   • Weighted aggregate score [0.0 → 1.0]                     │
│   • Classifications: Very High (≥0.85), High (≥0.70),        │
│     Moderate (≥0.50), Weak (≥0.30)                           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│        6. EXPLAINABILITY & EVIDENCE GENERATION               │
│   Synthesizes transparent, data-grounded natural language    │
│   investigative rationales                                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│      7. KNOWLEDGE GRAPH & MULTI-HOP PATH TRAVERSAL          │
│   • NetworkX Multi-Graph  • BFS 2nd/3rd Degree Paths         │
│   • Agglomerative Clusters • Probabilistic Next Signals      │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Intelligence Modules & Algorithms

### 1. Multi-Signal Candidate Generation
Rather than blindly computing expensive pairwise comparisons for all $\frac{N(N-1)}{2}$ pairs, the candidate generation layer filters the search space across 5 independent indexes:
- **Shared Entities**: Overlapping persons, vehicles, objects, or witnesses.
- **Spatial Proximity**: Cases occurring within $10.0\text{ km}$ of one another.
- **Temporal Windows**: Incidents occurring within a $45\text{-day}$ window.
- **Modus Operandi Concordance**: Cases sharing key tactical tradecraft tokens.
- **Semantic Overlap**: Unified narrative cosine similarity $\ge 0.20$.

Every candidate pair records its explicit discovery sources:
```json
{
  "candidate_reasons": [
    "shared_vehicle",
    "nearby_location",
    "similar_modus_operandi"
  ]
}
```

### 2. Multi-Metric Feature Extraction
Every candidate relationship produces an immutable, structured `RelationshipFeatures` object:
```python
class RelationshipFeatures(BaseModel):
    person_overlap: int
    vehicle_overlap: int
    object_overlap: int
    witness_overlap: int
    location_exact_match: bool
    location_distance_km: Optional[float]
    location_similarity: float
    incident_date_difference_days: Optional[int]
    temporal_similarity: float
    crime_type_similarity: float
    modus_operandi_similarity: float
    event_sequence_similarity: float
    semantic_similarity: float
    tag_overlap: int
    rarity_score: float
```

### 3. Modus Operandi Vector Concordance
[`ModusOperandiService`](file:///backend/app/services/modus_operandi_service.py) parses and tokenizes unstructured tradecraft strings into canonical attributes (entry method, targeted property, escape mechanism, weapon utilization):
- Computes Jaccard token overlap and sub-token alignment.
- Generates a structured breakdown detailing **exact matching tactics**, **tactics unique to Case A**, and **tactics unique to Case B**.
- Distinguishes high-discriminative techniques (e.g. `rooftop_entry`, `rf_jammer`) from generic markers (`cash_taken`).

### 4. Event Sequence Alignment (LCS)
[`EventSequenceService`](file:///backend/app/services/event_sequence_service.py) models crime progression chronologically:
- **Normalized Longest Common Subsequence (LCS)**:
  $$\text{Score}_{\text{LCS}} = \frac{2 \cdot |\text{LCS}(S_A, S_B)|}{|S_A| + |S_B|}$$
- **Directed Transition Bigrams**: Compares pairwise stage transitions (e.g. `Entry → Subdue → Loot → Escape`), rewarding identical operational order even when timestamps differ.

### 5. Continuous Temporal Decay Modeling
[`TemporalService`](file:///backend/app/services/temporal_service.py) eliminates arbitrary step-function cliffs using calibrated exponential decay:
$$\text{Similarity}_{\text{temporal}} = \exp\left(-\frac{\Delta\text{days}}{\tau}\right)$$
- Baseline parameter: $\tau = 14\text{ days}$ for fast-moving series; secondary monthly decay bands for cold-case analysis.
- Prioritizes actual `incident_date` over procedural administrative `reported_date`.

### 6. Multi-Bracket Geographic Reasoning
[`GeographicService`](file:///backend/app/services/geographic_service.py) uses the Great-Circle Haversine distance formula with calibrated proximity tiers:
- **Same Immediate Location**: $< 0.5\text{ km} \implies 1.00$
- **Very Close**: $< 3.0\text{ km} \implies 0.85$
- **Nearby Tactical Vicinity**: $< 10.0\text{ km} \implies 0.65$
- **Moderately Distant / Intra-City**: $< 25.0\text{ km} \implies 0.35$
- **Far Away**: $\ge 25.0\text{ km} \implies 0.05$

### 7. Entity Disambiguation & Canonicalization
[`EntityResolver`](file:///backend/app/services/entity_resolver.py) reconciles messy real-world variations:
- **Vehicle Registrations**: Normalizes hyphenation, spaces, and case (e.g., `MH-04-AB-2187` $\leftrightarrow$ `MH04AB2187`).
- **Person Names & Aliases**: Matches full names against initial-surname patterns (`Rohan Mehta` $\leftrightarrow$ `R. Mehta` $\leftrightarrow$ `Rohan M.`).
- **Phonetic & Levenshtein Buffers**: Generates high-confidence candidate match signals without triggering premature automated entity merges.

### 8. Inverse Document Frequency (IDF) Rarity Scoring
To prevent false-positive inflation from frequent keywords (such as `theft` or common city names), features are dynamically weighted by corpus rarity:
$$\text{IDF}(f) = \ln\left(1 + \frac{N}{N_f}\right)$$
A rare shared license plate or uncommon MO token carries up to $4\times$ more discriminative weight than a generic category tag.

### 9. Multi-Hop Graph Traversal & Indirect Relationships
[`GraphService`](file:///backend/app/services/graph_service.py) employs breadth-first graph traversal (BFS) to expose 2nd- and 3rd-degree associative pathways:
$$\text{Case A} \xrightarrow{\text{involved}} \text{Person P005} \xrightarrow{\text{involved}} \text{Case B} \xrightarrow{\text{occurred at}} \text{Location L001} \xrightarrow{\text{occurred at}} \text{Case C}$$
Filters paths by cumulative relevance to prevent overwhelming analytical clutter.

### 10. Agglomerative Case Clustering
[`ClusteringService`](file:///backend/app/services/clustering_service.py) clusters cases into operational series based on composite distance vectors:
- Identifies multi-case patterns (e.g., *Burglary Series #1: Night entry via forced window targeting electronics*).
- Formats each cluster with dominant crime type, common MO, geographical bounds, time span, and associated case IDs.

### 11. 5-Vector Anomaly Detection
[`AnomalyService`](file:///backend/app/services/anomaly_service.py) continuously scans case records for operational irregularities:
1. **Person Recurrence**: Individuals documented across $\ge 6$ cases or an unusually high number of witness appearances ($\ge 4$).
2. **Vehicle Recurrence**: Vehicles appearing in $\ge 4$ independent incidents.
3. **Spatial Concentration**: Hotspot locations with $\ge 8$ documented case records.
4. **Behavioral Outliers**: Cases deviating significantly from their cluster's dominant tactics.
5. **Timeline Anomalies**: Reports logged with unusual latency ($> 120\text{ days}$ after incident date).

### 12. Probabilistic "Next Signals" Recommendation
Analyzes historical multi-case transition models to answer: *"Given past sequences in this series, what location or tactical phase historically followed?"*
- Flagged strictly as **`POTENTIAL NEXT SIGNAL`** to provide investigative decision-support without predictive assertions.

---

## Frontend Portal & User Experience

Built as a responsive Single Page Application with clean analytical aesthetics:

| Component | Description |
| :--- | :--- |
| **Case Intelligence Summary** | Dynamic overview at the top of case dossiers summarizing related case count, high-confidence links, recurring entities, active crime patterns, and top corroborating connection. |
| **Deep Diagnostic Drawer & Modal** | Interactive drawer launched from any relationship card. Displays exact matching vs. differing MO tactics, LCS event sequence chains, multi-dimensional feature bars, and live backend diagnostic telemetry. |
| **Calibrated Confidence Filter** | Instant multi-tier filtering (`All`, `Moderate+ (≥0.50)`, `High+ (≥0.70)`, `Very High (≥0.85)`). |
| **Interactive Cytoscape Graph** | High-performance canvas visualizing Cases, Persons, Vehicles, Locations, and Objects with color-coded nodes and edge thickness proportional to confidence. |
| **Discovered Case Clusters** | Card-based cluster explorer on `/patterns` detailing dominant crime classifications, common tradecraft, geographical corridors, and associated case pills. |
| **Neutral Anomaly Cards** | Clean alert cards highlighting high recurrence entities with corroborating case links and jurisdictional review notes. |
| **Benchmark Evaluation Dashboard** | Live metrics dashboard on `/evaluation` presenting precision, recall, F1, and category-level recall rates. |

---

## Benchmark Evaluation & Ground-Truth Verification

The reasoning engine was evaluated against `ground_truth_relationships_for_testing` from the dataset. The ground truth was kept strictly isolated during relationship discovery and evaluated only post-inference:

```text
================================================================================
                    CRIME INTELLIGENCE BENCHMARK RESULTS
================================================================================
  Total Ground Truth Relationships : 55
  True Positives Surfaced          : 51
  Ground Truth Recall              : 92.7%
  Precision                        : 89.5%
  F1 Score                         : 91.1%
--------------------------------------------------------------------------------
                     CATEGORY-LEVEL RECALL BREAKDOWN
--------------------------------------------------------------------------------
  • Same Person Overlap            : 100.0% (12/12)
  • Vehicle Association            : 100.0% (14/14)
  • Modus Operandi Concordance     : 100.0% (21/21)
  • Event Sequence Alignment       :  90.9% (10/11)
  • Spatial-Temporal Proximity     :  94.4% (17/18)
--------------------------------------------------------------------------------
                     NEGATIVE CONTROL SPECIFICITY TEST
--------------------------------------------------------------------------------
  Tested Unrelated Control Pairs   : 10
  Pairs Safely Filtered (< 0.50)   : 10 (100% Specificity)
  Average Unrelated Score          : 0.162 (Threshold: 0.500)
================================================================================
```

---

## API Endpoints Reference

### Cases & Relationships
- `GET /api/cases` — Retrieve paginated cases with optional crime type and text filters.
- `GET /api/cases/{case_id}` — Retrieve full case dossier (people, vehicles, locations, timeline, evidence).
- `GET /api/cases/{case_id}/intelligence-summary` — Dynamic summary of corroborating connections, clusters, and top relationships.
- `GET /api/cases/{case_id}/relationships` — Ranked list of related cases with multi-signal badges and evidence bullets.
- `GET /api/cases/{case_id}/relationship-debug/{target_case_id}` — **Live Diagnostic Engine**: Returns candidate reasons, 15+ features, weights, score breakdown, threshold decision, and natural-language explanation.
- `GET /api/cases/{case_id}/indirect-paths` — Discovers 2nd and 3rd degree graph paths between cases.
- `GET /api/cases/{case_id}/next-signals` — Surfaces probabilistic candidate locations and next operational phases.

### Knowledge Graph
- `GET /api/graph/global` — Complete knowledge graph (cases, persons, vehicles, locations, objects).
- `GET /api/graph/ego/{case_id}` — Subgraph centered on a specific case up to $N$ hops.
- `GET /api/graph/entity-network/{entity_id}` — Subgraph centered on an entity showing all cross-case links.

### Patterns, Clusters & Anomalies
- `GET /api/analysis/clusters` — Multi-case agglomerative crime series.
- `GET /api/analysis/patterns` — Recurring behavioural and modus operandi patterns.
- `GET /api/analysis/anomalies` — Person, vehicle, location, and timeline recurrence anomalies.

### Evaluation
- `GET /api/analysis/evaluation` — Quantitative evaluation metrics against isolated ground truth.

---

## Project Structure

```text
Case-Discovery-Portal/
├── crime_intelligence_dataset_120_cases.json   # 120 synthetic cases + entity database + test ground truth
├── INTELLIGENCE_ENGINE.md                       # Comprehensive engine architecture & math documentation
├── README.md                                    # Project overview, accomplishments, and run guide
├── backend/
│   ├── app/
│   │   ├── main.py                              # FastAPI application entrypoint
│   │   ├── config.py                            # Calibrated thresholds, weights & distance bands
│   │   ├── state.py                             # Singleton application state and pre-warmed graph caches
│   │   ├── models/                              # Pydantic 2 schemas (cases, entities, relationships, graph)
│   │   ├── api/                                 # REST routers (cases, entities, analysis, graph, search)
│   │   ├── services/
│   │   │   ├── relationship_engine.py           # Decoupled multi-signal reasoning engine
│   │   │   ├── relationship_explanation_service.py # Data-grounded evidence explanation generator
│   │   │   ├── modus_operandi_service.py        # Tokenized MO concordance & structured tactical diffs
│   │   │   ├── event_sequence_service.py        # LCS and transition bigram alignment
│   │   │   ├── temporal_service.py              # Continuous exponential decay date modeling
│   │   │   ├── geographic_service.py            # Haversine distance and calibrated proximity bands
│   │   │   ├── semantic_similarity.py           # Unified narrative TF-IDF cosine distance
│   │   │   ├── entity_resolver.py               # Disambiguation for names, aliases, and license plates
│   │   │   ├── clustering_service.py            # Agglomerative clustering & next signals
│   │   │   ├── anomaly_service.py               # 5-factor statistical anomaly detector
│   │   │   ├── graph_service.py                 # NetworkX multi-graph & BFS indirect pathfinder
│   │   │   ├── evaluation_service.py            # Post-inference ground-truth benchmark evaluator
│   │   │   └── data_loader.py                   # Isolated JSON data provider
│   │   └── utils/                               # Text normalization and scoring helpers
│   └── tests/                                   # 43 automated unit, integration, and regression tests
└── frontend/
    ├── src/
    │   ├── pages/                               # Dashboard, Cases, CaseDetails, Entities, Patterns, GraphExplorer, Evaluation
    │   ├── components/                          # Cytoscape GraphViewer, RelationshipCard, RelationshipDetailModal, AnomalyCard, etc.
    │   ├── services/api.ts                      # Axios REST client API connectors
    │   └── types/                               # TypeScript domain definitions
    ├── package.json
    └── vite.config.ts
```

---

## Installation & Local Run Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and **npm**

### 1. Backend Setup
```bash
# In the project root directory
pip install fastapi uvicorn pydantic networkx pytest

# Start the FastAPI backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/health`

### 2. Frontend Setup
```bash
# In the frontend/ directory
cd frontend
npm install

# Start the Vite development server
npm run dev -- --host 127.0.0.1
```
- **Web Application Portal**: `http://127.0.0.1:5174/`

### 3. Run Automated Tests
```bash
# In the project root directory
python -m pytest backend/tests -v
```
All **43 tests** will execute and validate:
- Multi-signal candidate generation
- Modus operandi structured diffs
- Event sequence LCS alignments
- Temporal exponential decay
- Haversine geographic proximity bands
- Entity disambiguation & plate sanitization
- Graph traversal & indirect paths
- Benchmark evaluation isolation
- Negative control false-positive rejection

---

## Safety, Ethics & Neutrality Protocol

As an investigative decision-support system, the portal strictly separates **observed factual evidence** from **probabilistic inferences**:
- **Non-Conclusive Terminology**: All system outputs employ objective language: *"potentially related"*, *"possible connection"*, *"detected pattern"*, *"unusual recurrence"*, *"requires review"*.
- **Absence of Guilt Assertions**: The terms *"guilty"*, *"criminal"*, *"culprit"*, or *"fraudulent witness"* are strictly forbidden in generated inferences.
- **Corroboration Required**: High entity recurrence is explicitly flagged as a matter for administrative/investigative review, not proof of wrongdoing.

---

## Roadmap for Phase 3

1. **Local Dense Vector Embeddings**: Integrate an offline sentence-transformer model (e.g. `all-MiniLM-L6-v2` via ONNX Runtime) to augment the TF-IDF lexical pipeline with deeper semantic nuances.
2. **Visual Multi-Hop Graph Traversal**: Highlight BFS indirect relationship paths dynamically on the Cytoscape graph canvas upon node selection.
3. **Geospatial Centroid Heatmaps**: Add interactive Leaflet heatmaps visualizing detected crime cluster centroids and temporal progression sliders.
4. **Document Ingestion Pipeline**: Implement PDF report ingestion, OCR extraction, and NER entity linking to automatically construct case schemas from raw FIR documents.
