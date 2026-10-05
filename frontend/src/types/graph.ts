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
  confidence: number;
  category: 'DIRECT' | 'STRONG' | 'MODERATE' | 'WEAK' | string;
  evidence: string[];
  score_breakdown?: RelationshipScoreBreakdown;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
