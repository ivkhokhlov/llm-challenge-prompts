import * as fs from 'fs';
import * as path from 'path';

type Classification = 'Low' | 'Medium' | 'High';
type Confidence = 'Low' | 'Medium' | 'High';
type MetricKey = 'antiPatterns' | 'codeStyle' | 'designPatterns';

interface MetricData {
  confidence: Confidence;
  score: number;
}

interface Pull {
  id: string;
}

interface PullReview {
  pull: Pull;
  complexity: { classification: Classification };
  antiPatterns: MetricData;
  codeStyle: MetricData;
  designPatterns: MetricData;
}

interface AggregationDetail {
  id: string;
  complexity: Classification;
  confidence: Confidence;
  score: number;
  weight: number;
}

interface AggregationResult {
  aggregatedScore: number;
  details: AggregationDetail[];
}

// 1) Load data
const raw = fs.readFileSync(path.resolve(__dirname, 'pull_reviews.json'), 'utf-8');
const data = JSON.parse(raw);
const pullReviews: PullReview[] = data.pullReviews;

// 2) Define weight mappings
const complexityWeight: Record<Classification, number> = {
  Low: 1.0,
  Medium: 1.5,
  High: 2.0,
};

const confidenceWeight: Record<Confidence, number> = {
  Low: 0.75,
  Medium: 1.0,
  High: 1.25,
};

// 3) Function to aggregate a single metric
function aggregateMetric(
  reviews: PullReview[],
  metricKey: MetricKey
): AggregationResult {
  let numerator = 0;
  let denominator = 0;
  const details: AggregationDetail[] = [];

  for (const pr of reviews) {
    const id = pr.pull.id;
    const comp = pr.complexity.classification;
    const { confidence, score } = pr[metricKey];
    const weight =
      complexityWeight[comp] * confidenceWeight[confidence];

    numerator += score * weight;
    denominator += weight;

    details.push({
      id,
      complexity: comp,
      confidence,
      score,
      weight: Math.round(weight * 1000) / 1000,
    });
  }

  const aggScore = denominator > 0 ? numerator / denominator : 0;

  return {
    aggregatedScore: Math.round(aggScore * 100) / 100,
    details,
  };
}

// 4) Build summary for all three metrics
const metrics: MetricKey[] = ['antiPatterns', 'codeStyle', 'designPatterns'];
const summary: Record<MetricKey, AggregationResult> = {} as any;

for (const m of metrics) {
  summary[m] = aggregateMetric(pullReviews, m);
}

// 5) Output result
console.log(JSON.stringify(summary, null, 2));
