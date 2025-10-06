// Prediction Validation and Confidence Scoring System

export interface PredictionValidation {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low' | 'very_low';
  confidenceScore: number; // 0-100
  factors: {
    dataQuality: number; // 0-100
    historicalDepth: number; // 0-100
    trendConsistency: number; // 0-100
    seasonalAlignment: number; // 0-100
  };
  warnings: string[];
  recommendations: string[];
}

export class PredictionValidator {
  /**
   * Validate prediction quality and calculate confidence score
   */
  static validatePrediction(
    historicalDataPoints: any[],
    predictionText: string,
    queryType: string
  ): PredictionValidation {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // 1. Data Quality Assessment
    const dataQuality = this.assessDataQuality(historicalDataPoints, warnings);

    // 2. Historical Depth Assessment
    const historicalDepth = this.assessHistoricalDepth(historicalDataPoints, warnings);

    // 3. Trend Consistency Assessment
    const trendConsistency = this.assessTrendConsistency(historicalDataPoints, warnings);

    // 4. Seasonal Alignment Assessment
    const seasonalAlignment = this.assessSeasonalAlignment(historicalDataPoints, warnings);

    // Calculate overall confidence score (weighted average)
    const confidenceScore = Math.round(
      dataQuality * 0.3 +
      historicalDepth * 0.3 +
      trendConsistency * 0.25 +
      seasonalAlignment * 0.15
    );

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low' | 'very_low';
    if (confidenceScore >= 75) {
      confidence = 'high';
    } else if (confidenceScore >= 50) {
      confidence = 'medium';
    } else if (confidenceScore >= 30) {
      confidence = 'low';
    } else {
      confidence = 'very_low';
    }

    // Generate recommendations
    if (historicalDepth < 50) {
      recommendations.push('Gather more historical data (minimum 6 months recommended)');
    }
    if (trendConsistency < 50) {
      recommendations.push('High volatility detected - consider range-based predictions');
    }
    if (dataQuality < 50) {
      recommendations.push('Data quality issues detected - verify data sources');
    }

    return {
      isValid: confidenceScore >= 30, // Minimum 30% confidence to be valid
      confidence,
      confidenceScore,
      factors: {
        dataQuality,
        historicalDepth,
        trendConsistency,
        seasonalAlignment
      },
      warnings,
      recommendations
    };
  }

  /**
   * Assess data quality (completeness, consistency)
   */
  private static assessDataQuality(dataPoints: any[], warnings: string[]): number {
    if (!dataPoints || dataPoints.length === 0) {
      warnings.push('No historical data available');
      return 0;
    }

    let score = 100;

    // Check for missing data points
    const missingCount = dataPoints.filter(dp => !dp || dp.error).length;
    const missingRate = missingCount / dataPoints.length;

    if (missingRate > 0.3) {
      score -= 40;
      warnings.push(`${Math.round(missingRate * 100)}% of data points are missing or invalid`);
    } else if (missingRate > 0.1) {
      score -= 20;
      warnings.push(`Some data points are missing (${Math.round(missingRate * 100)}%)`);
    }

    // Check for data completeness (records within each data point)
    let totalRecords = 0;
    let validDataPoints = 0;

    for (const dp of dataPoints) {
      if (dp && !dp.error) {
        validDataPoints++;
        const recordCount = this.extractRecordCount(dp);
        if (recordCount > 0) {
          totalRecords += recordCount;
        }
      }
    }

    const avgRecordsPerPoint = validDataPoints > 0 ? totalRecords / validDataPoints : 0;

    if (avgRecordsPerPoint < 5) {
      score -= 20;
      warnings.push('Low data volume per period (sparse data)');
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Assess historical depth (how much historical data we have)
   */
  private static assessHistoricalDepth(dataPoints: any[], warnings: string[]): number {
    const validPoints = dataPoints.filter(dp => dp && !dp.error).length;

    if (validPoints === 0) {
      warnings.push('No valid historical data points');
      return 0;
    }

    // Scoring based on number of historical periods
    let score = 0;
    if (validPoints >= 12) {
      score = 100; // 12+ months - excellent
    } else if (validPoints >= 6) {
      score = 80; // 6-11 months - good
    } else if (validPoints >= 3) {
      score = 50; // 3-5 months - acceptable
      warnings.push('Limited historical data (3-5 months)');
    } else {
      score = 20; // 1-2 months - poor
      warnings.push('Very limited historical data (<3 months)');
    }

    return score;
  }

  /**
   * Assess trend consistency (how stable/predictable the trend is)
   */
  private static assessTrendConsistency(dataPoints: any[], warnings: string[]): number {
    const validPoints = dataPoints.filter(dp => dp && !dp.error);

    if (validPoints.length < 2) {
      warnings.push('Insufficient data for trend analysis');
      return 0;
    }

    // Extract numeric values for trend analysis
    const values = validPoints.map(dp => this.extractNumericValue(dp)).filter(v => v !== null);

    if (values.length < 2) {
      warnings.push('Cannot extract numeric values for trend analysis');
      return 0;
    }

    // Calculate coefficient of variation (CV) as measure of consistency
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean !== 0 ? (stdDev / mean) : 0;

    // Lower CV = higher consistency
    let score = 100;
    if (cv > 1.0) {
      score = 20; // Very high volatility
      warnings.push('Very high volatility detected - predictions unreliable');
    } else if (cv > 0.5) {
      score = 40; // High volatility
      warnings.push('High volatility detected in historical data');
    } else if (cv > 0.3) {
      score = 60; // Moderate volatility
    } else if (cv > 0.15) {
      score = 80; // Low volatility
    } else {
      score = 100; // Very low volatility
    }

    return score;
  }

  /**
   * Assess seasonal alignment (detect seasonal patterns)
   */
  private static assessSeasonalAlignment(dataPoints: any[], warnings: string[]): number {
    // For now, use a simplified approach
    // In production, you'd analyze month-over-month patterns for seasonality

    const validPoints = dataPoints.filter(dp => dp && !dp.error);

    if (validPoints.length < 12) {
      // Not enough data for full seasonal analysis
      return 50; // Neutral score
    }

    // If we have 12+ months, we can detect seasonality
    // This is a placeholder - full seasonal decomposition would be more complex
    return 75;
  }

  /**
   * Extract record count from data point
   */
  private static extractRecordCount(dataPoint: any): number {
    if (!dataPoint) return 0;

    // Try various common structures
    if (dataPoint.recordCount) return dataPoint.recordCount;
    if (dataPoint.record_count) return dataPoint.record_count;
    if (dataPoint.total_count) return dataPoint.total_count;
    if (dataPoint.count) return dataPoint.count;
    if (dataPoint.data && Array.isArray(dataPoint.data)) return dataPoint.data.length;
    if (Array.isArray(dataPoint)) return dataPoint.length;

    return 0;
  }

  /**
   * Extract numeric value from data point (for trend analysis)
   */
  private static extractNumericValue(dataPoint: any): number | null {
    if (!dataPoint) return null;

    // Try to extract revenue, total, count, etc.
    if (typeof dataPoint === 'number') return dataPoint;
    if (dataPoint.revenue) return parseFloat(dataPoint.revenue);
    if (dataPoint.total) return parseFloat(dataPoint.total);
    if (dataPoint.count) return parseFloat(dataPoint.count);
    if (dataPoint.value) return parseFloat(dataPoint.value);

    // Try to count records as a proxy
    const recordCount = this.extractRecordCount(dataPoint);
    return recordCount > 0 ? recordCount : null;
  }

  /**
   * Format validation result as user-friendly message
   */
  static formatValidationMessage(validation: PredictionValidation): string {
    const lines: string[] = [];

    lines.push(`**Confidence: ${validation.confidence.toUpperCase()} (${validation.confidenceScore}%)**`);
    lines.push('');
    lines.push('**Quality Factors:**');
    lines.push(`- Data Quality: ${validation.factors.dataQuality}%`);
    lines.push(`- Historical Depth: ${validation.factors.historicalDepth}%`);
    lines.push(`- Trend Consistency: ${validation.factors.trendConsistency}%`);
    lines.push(`- Seasonal Alignment: ${validation.factors.seasonalAlignment}%`);

    if (validation.warnings.length > 0) {
      lines.push('');
      lines.push('**⚠️ Warnings:**');
      validation.warnings.forEach(w => lines.push(`- ${w}`));
    }

    if (validation.recommendations.length > 0) {
      lines.push('');
      lines.push('**💡 Recommendations:**');
      validation.recommendations.forEach(r => lines.push(`- ${r}`));
    }

    return lines.join('\n');
  }
}
