import { RelationshipScoreBreakdown } from './relationship';

export interface GraphNode {
  id: string;
  type: 'CASE' | 'PERSON' | 'LOCATION' | 'VEHICLE' | 'OBJECT' | 'EVENT' | string;
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
  relationship_type_label?: string;
  edge_label?: string;
  confidence: number;
  category: 'DIRECT' | 'STRONG' | 'MODERATE' | 'WEAK' | string;
  evidence: string[];
  score_breakdown?: RelationshipScoreBreakdown;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
