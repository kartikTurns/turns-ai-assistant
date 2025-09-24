// Business Knowledge and Industry Insights for Intelligent Fallback Responses
//buisnnessKnowledge.ts
export interface BusinessInsight {
  category: string;
  insight: string;
  confidence: 'high' | 'medium' | 'low';
  applicableScenarios: string[];
}

export class LaundryBusinessKnowledge {

  // Industry benchmarks and typical patterns
  static getIndustryBenchmarks() {
    return {
      averageRevenuePerCustomerPerMonth: { min: 15, max: 45, typical: 25 },
      peakHours: ['6-9 AM', '5-8 PM', 'weekends'],
      seasonalTrends: {
        winter: 'Higher volume due to heavier clothing and indoor drying needs',
        spring: 'Moderate volume with cleaning seasonal items',
        summer: 'Lower volume, more frequent smaller loads',
        fall: 'Increasing volume as weather changes'
      },
      customerRetentionRate: { typical: 0.7, good: 0.8, excellent: 0.9 },
      averageOrderValue: { min: 8, max: 25, typical: 15 },
      dailyCustomerFlow: { weekday: '40-60 customers', weekend: '80-120 customers' }
    };
  }

  // Common operational insights
  static getOperationalInsights(): BusinessInsight[] {
    return [
      {
        category: 'Customer Patterns',
        insight: 'Most customers visit 2-3 times per month with consistent timing preferences',
        confidence: 'high',
        applicableScenarios: ['customer analysis', 'scheduling', 'capacity planning']
      },
      {
        category: 'Revenue Optimization',
        insight: 'Premium services (dry cleaning, special care) typically account for 30-40% of revenue despite being 15-20% of volume',
        confidence: 'high',
        applicableScenarios: ['revenue analysis', 'service optimization', 'pricing']
      },
      {
        category: 'Seasonal Trends',
        insight: 'Winter months show 20-30% higher volume due to heavier items and reduced home drying',
        confidence: 'medium',
        applicableScenarios: ['trend analysis', 'forecasting', 'capacity planning']
      },
      {
        category: 'Peak Operations',
        insight: 'Morning rush (7-9 AM) and evening pickup (5-7 PM) account for 60% of daily transactions',
        confidence: 'high',
        applicableScenarios: ['scheduling', 'staffing', 'customer flow']
      },
      {
        category: 'Service Mix',
        insight: 'Wash-and-fold services typically have higher profit margins than self-service options',
        confidence: 'medium',
        applicableScenarios: ['service analysis', 'profitability', 'business strategy']
      }
    ];
  }

  // Generate contextual insights based on query type
  static getContextualInsights(queryType: string, timeframe?: string): string[] {
    const insights: string[] = [];

    switch (queryType.toLowerCase()) {
      case 'revenue':
      case 'sales':
        insights.push(
          'Laundromat revenue typically follows predictable patterns based on customer frequency and service mix',
          'Premium services often drive disproportionate revenue despite lower volume',
          'Seasonal variations can impact revenue by 15-25% between peak and low seasons'
        );
        break;

      case 'customer':
      case 'customers':
        insights.push(
          'Customer retention is crucial in the laundry business with typical rates around 70-80%',
          'Most customers establish regular patterns within 2-3 visits',
          'Customer lifetime value varies significantly between self-service and full-service users'
        );
        break;

      case 'trend':
      case 'trends':
        insights.push(
          'Laundry businesses show strong seasonal patterns with winter peaks and summer lows',
          'Weekly patterns typically show higher weekend activity and Monday/Tuesday lulls',
          'Economic factors significantly impact customer frequency and service choices'
        );
        break;

      default:
        insights.push(
          'Laundromat operations are highly predictable with consistent patterns in customer behavior',
          'Success factors include location, service quality, convenience, and competitive pricing'
        );
    }

    return insights;
  }

  // Generate recommendations when data is limited
  static getDataCollectionRecommendations(failedTool: string): string[] {
    const recommendations: string[] = [];

    switch (failedTool.toLowerCase()) {
      case 'revenue':
      case 'sales':
        recommendations.push(
          'Implement daily sales tracking by service type',
          'Monitor peak hours and seasonal patterns',
          'Track average transaction values and customer frequency'
        );
        break;

      case 'customer':
        recommendations.push(
          'Implement customer tracking system with visit frequency',
          'Monitor customer retention and acquisition rates',
          'Track service preferences and spending patterns'
        );
        break;

      default:
        recommendations.push(
          'Establish regular data collection and monitoring systems',
          'Implement automated tracking for key business metrics',
          'Consider customer feedback and satisfaction surveys'
        );
    }

    return recommendations;
  }

  // Provide business reasoning for empty data scenarios
  static explainEmptyData(toolName: string, parameters: any): string {
    const explanations = {
      noRecentData: 'This could indicate a new business, data collection issues, or a temporary operational pause.',
      seasonalLow: 'Low activity might reflect seasonal patterns typical in the laundry industry.',
      filteringTooStrict: 'The search criteria might be too specific, excluding relevant data.',
      systemIssues: 'Technical issues with data collection or storage systems could cause missing data.',
      businessChanges: 'Recent operational changes might affect data availability or format.'
    };

    return `Empty data for ${toolName} could suggest several scenarios: ${Object.values(explanations).join(' ')} Consider adjusting parameters or investigating data collection processes.`;
  }
}

// Export utility functions
export function generateFallbackContext(
  toolName: string,
  parameters: any,
  dataQuality: 'empty' | 'limited' | 'failed'
): string {
  const knowledge = LaundryBusinessKnowledge;

  let context = '';

  switch (dataQuality) {
    case 'empty':
      context = knowledge.explainEmptyData(toolName, parameters);
      break;
    case 'limited':
      context = `Limited data available for ${toolName}. Apply industry knowledge to enhance insights.`;
      break;
    case 'failed':
      context = `Tool ${toolName} failed. Provide expert analysis based on business knowledge.`;
      break;
  }

  return context;
}

export function getBusinessRecommendations(scenario: string): string[] {
  const knowledge = LaundryBusinessKnowledge;
  return knowledge.getDataCollectionRecommendations(scenario);
}

export default LaundryBusinessKnowledge;