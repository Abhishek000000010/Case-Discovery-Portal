# Crime Intelligence & Case Relationship Discovery Portal

A modern, academic decision-support prototype and investigative intelligence portal designed to automatically discover meaningful direct, indirect, semantic, temporal, geographical, behavioural, and entity-based relationships across crime incidents.

---

## Key Capabilities (Phase 2 Upgrade)

- **Semantic Multi-Signal Case Reasoning**: Discovers cross-incident relationships from underlying evidence rather than hardcoded scenario rules.
- **Modus Operandi (MO) Vector Comparison**: Analyzes tactical tradecraft with tokenized set intersection, sub-token alignment, and matching vs differing technique breakdown.
- **Behavioral Event-Sequence Alignment**: Normalized Longest Common Subsequence (LCS) and directed transition bigram tracking across incident timelines.
- **Smooth Temporal Decay**: Replaces arbitrary bucket cutoffs with calibrated continuous exponential decay ($\exp(-\Delta\text{days} / 14)$).
- **Geographic Reasoning**: Great-circle Haversine distance and calibrated multi-bracket proximity bands (immediate, nearby, corridor).
- **Rarity-Aware Scoring**: Inverse Document Frequency (IDF) weighting that rewards rare shared identifiers and dampens common generic tags.
- **Explainability Engine & Live Diagnostics**: Translates multi-metric feature vectors into human-readable investigative rationale, accessible via a deep diagnostic drawer and API.
- **Case Clustering & Behavioral Patterns**: Agglomerative clustering identifying recurring series (e.g., night burglaries, electronic thefts, vehicle swaps).
- **Investigative Next Signals**: Probabilistic analysis surfacing candidate locations and tactical transitions based on historical case series.
- **Interactive Knowledge Graph & Multi-Hop Traversal**: Visual network explorer supporting direct and indirect (2nd/3rd degree) path analysis.
- **Strict Ground-Truth Evaluation**: Evaluates precision, recall, category-level detection rates, and negative control specificity without inference leakage.

---

## Project Structure

```text
major project/
├── crime_intelligence_dataset_120_cases.json   # 120 synthetic cases + entities + test ground truth
├── INTELLIGENCE_ENGINE.md                       # Comprehensive engine architecture documentation
├── README.md                                    # Project overview and run guide
├── backend/
│   ├── app/
│   │   ├── main.py                              # FastAPI application entrypoint
│   │   ├── config.py                            # Calibrated thresholds, weights & distance bands
│   │   ├── state.py                             # In-memory singleton state and graph caches
│   │   ├── models/                              # Pydantic case, entity, relationship & graph models
│   │   ├── api/                                 # REST routers (cases, entities, analysis, graph, search)
│   │   ├── services/
│   │   │   ├── relationship_engine.py           # Layered relationship discovery engine
│   │   │   ├── relationship_explanation_service.py # Natural-language evidence generator
│   │   │   ├── modus_operandi_service.py        # Tokenized MO comparison & diffs
│   │   │   ├── event_sequence_service.py        # LCS and transition bigram concordance
│   │   │   ├── temporal_service.py              # Exponential decay date analysis
│   │   │   ├── geographic_service.py            # Haversine distance and proximity bands
│   │   │   ├── semantic_similarity.py           # Unified narrative TF-IDF cosine distance
│   │   │   ├── entity_resolver.py               # Disambiguation for names, aliases, and license plates
│   │   │   ├── clustering_service.py            # Agglomerative clustering & next signals
│   │   │   ├── anomaly_service.py               # 5-factor statistical anomaly detector
│   │   │   ├── graph_service.py                 # NetworkX multi-hop knowledge graph
│   │   │   ├── evaluation_service.py            # Ground-truth benchmark evaluator
│   │   │   └── data_loader.py                   # Isolated JSON data provider
│   │   └── utils/                               # Text normalization and scoring helpers
│   └── tests/                                   # 43 automated unit, integration, and regression tests
└── frontend/
    ├── src/
    │   ├── pages/                               # Dashboard, Cases, CaseDetails, Entities, Patterns, GraphExplorer, Evaluation
    │   ├── components/                          # Cytoscape GraphViewer, RelationshipCard, RelationshipDetailModal, EvidencePanel, Timeline
    │   ├── services/api.ts                      # REST client API connectors
    │   └── types/                               # TypeScript domain contracts
    ├── package.json
    └── vite.config.ts
```

---

## Running the Application Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Start the Backend API Server
```bash
# In the project root directory
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
- API Documentation (Swagger): `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`

### 2. Start the Frontend Development Server
```bash
# In the frontend/ directory
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```
- Web Portal UI: `http://127.0.0.1:5174/`

### 3. Run Automated Tests
```bash
# Run all 43 backend tests
python -m pytest backend/tests -v
```

---

## Benchmark Evaluation Highlights

- **Ground Truth Benchmark Total**: 96 verified relationships
- **Discovered Relationships Matched**: 89
- **Benchmark Recall**: **92.71%**
- **Modus Operandi Category Recall**: **100.0%**
- **Pattern Similarity Category Recall**: **100.0%**
- **Behavioral Sequence Concordance Recall**: **100.0%**
- **Negative Control Specificity**: **100.0%** (Unrelated case pairs correctly rejected with zero false-positive leakage)
