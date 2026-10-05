import React from 'react';

interface ConfidenceBadgeProps {
  confidence: number;
  category?: string;
  showPercent?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  category,
  showPercent = true,
}) => {
  const percent = Math.round(confidence * 100);

  let badgeClass = 'badge-weak';
  let cat = category?.toUpperCase() || '';

  if (cat === 'DIRECT' || confidence >= 0.85) {
    badgeClass = 'badge-direct';
    if (!cat) cat = 'DIRECT';
  } else if (cat === 'STRONG' || confidence >= 0.70) {
    badgeClass = 'badge-strong';
    if (!cat) cat = 'STRONG';
  } else if (cat === 'MODERATE' || confidence >= 0.50) {
    badgeClass = 'badge-moderate';
    if (!cat) cat = 'MODERATE';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {showPercent && <span>{percent}%</span>}
      {cat && <span>• {cat}</span>}
    </span>
  );
};
