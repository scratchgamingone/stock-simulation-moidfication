export interface LinearRegressionResult {
    slope: number;
    intercept: number;
    rSquared: number;
}

export interface ConfidenceInterval {
    mean: number;
    marginOfError: number;
    lowerBound: number;
    upperBound: number;
    confidenceLevel: number;
}

function pairedFiniteValues(a: number[], b: number[]): [number, number][] {
    const pairCount = Math.min(a.length, b.length);
    const pairs: [number, number][] = [];

    for (let i = 0; i < pairCount; i++) {
        const x = a[i];
        const y = b[i];
        if (Number.isFinite(x) && Number.isFinite(y)) {
            pairs.push([x, y]);
        }
    }

    return pairs;
}

export function sanitizeFiniteValues(values: number[]): number[] {
    return values.filter((value) => Number.isFinite(value));
}

export function mean(values: number[]): number {
    const clean = sanitizeFiniteValues(values);
    if (clean.length === 0) {
        return 0;
    }

    return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

export function median(values: number[]): number {
    const clean = sanitizeFiniteValues(values).sort((a, b) => a - b);
    const length = clean.length;

    if (length === 0) {
        return 0;
    }

    const middle = Math.floor(length / 2);
    if (length % 2 === 0) {
        return (clean[middle - 1] + clean[middle]) / 2;
    }

    return clean[middle];
}

export function min(values: number[]): number {
    const clean = sanitizeFiniteValues(values);
    return clean.length > 0 ? Math.min(...clean) : 0;
}

export function max(values: number[]): number {
    const clean = sanitizeFiniteValues(values);
    return clean.length > 0 ? Math.max(...clean) : 0;
}

export function range(values: number[]): number {
    const clean = sanitizeFiniteValues(values);
    if (clean.length === 0) {
        return 0;
    }

    return max(clean) - min(clean);
}

export function sampleVariance(values: number[]): number {
    const clean = sanitizeFiniteValues(values);
    if (clean.length < 2) {
        return 0;
    }

    const avg = mean(clean);
    const squaredDistance = clean.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0);
    return squaredDistance / (clean.length - 1);
}

export function sampleStandardDeviation(values: number[]): number {
    return Math.sqrt(Math.max(sampleVariance(values), 0));
}

export function quantile(values: number[], p: number): number {
    const clean = sanitizeFiniteValues(values).sort((a, b) => a - b);
    if (clean.length === 0) {
        return 0;
    }

    const boundedP = Math.min(Math.max(p, 0), 1);
    const index = (clean.length - 1) * boundedP;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
        return clean[lower];
    }

    const weight = index - lower;
    return clean[lower] * (1 - weight) + clean[upper] * weight;
}

export function interquartileRange(values: number[]): number {
    return quantile(values, 0.75) - quantile(values, 0.25);
}

export function trimmedMean(values: number[], trimFraction = 0.1): number {
    const clean = sanitizeFiniteValues(values).sort((a, b) => a - b);
    if (clean.length === 0) {
        return 0;
    }

    const boundedTrim = Math.min(Math.max(trimFraction, 0), 0.49);
    const trimCount = Math.floor(clean.length * boundedTrim);
    const trimmed = clean.slice(trimCount, clean.length - trimCount);
    return mean(trimmed);
}

export function geometricMean(values: number[]): number {
    const clean = sanitizeFiniteValues(values).filter((value) => value > 0);
    if (clean.length === 0) {
        return 0;
    }

    const logMean = mean(clean.map((value) => Math.log(value)));
    return Math.exp(logMean);
}

export function medianAbsoluteDeviation(values: number[]): number {
    const clean = sanitizeFiniteValues(values);
    if (clean.length === 0) {
        return 0;
    }

    const med = median(clean);
    const absDeviations = clean.map((value) => Math.abs(value - med));
    return median(absDeviations);
}

export function zScores(values: number[]): number[] {
    const clean = sanitizeFiniteValues(values);
    const avg = mean(clean);
    const sd = sampleStandardDeviation(clean);

    if (sd === 0) {
        return clean.map(() => 0);
    }

    return clean.map((value) => (value - avg) / sd);
}

export function skewness(values: number[]): number {
    const clean = sanitizeFiniteValues(values);
    if (clean.length < 3) {
        return 0;
    }

    const avg = mean(clean);
    const sd = sampleStandardDeviation(clean);

    if (sd === 0) {
        return 0;
    }

    const n = clean.length;
    const thirdMoment = clean.reduce((sum, value) => sum + Math.pow((value - avg) / sd, 3), 0);
    return (n / ((n - 1) * (n - 2))) * thirdMoment;
}

export function excessKurtosis(values: number[]): number {
    const clean = sanitizeFiniteValues(values);
    if (clean.length < 4) {
        return 0;
    }

    const avg = mean(clean);
    const sd = sampleStandardDeviation(clean);

    if (sd === 0) {
        return 0;
    }

    const n = clean.length;
    const standardizedFourthMoment = clean.reduce((sum, value) => sum + Math.pow((value - avg) / sd, 4), 0);
    const correctionA = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
    const correctionB = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));

    return correctionA * standardizedFourthMoment - correctionB;
}

export function covariance(a: number[], b: number[]): number {
    const pairs = pairedFiniteValues(a, b);
    if (pairs.length < 2) {
        return 0;
    }

    const x = pairs.map((pair) => pair[0]);
    const y = pairs.map((pair) => pair[1]);
    const xMean = mean(x);
    const yMean = mean(y);

    let sum = 0;
    for (let i = 0; i < pairs.length; i++) {
        sum += (x[i] - xMean) * (y[i] - yMean);
    }

    return sum / (pairs.length - 1);
}

export function correlation(a: number[], b: number[]): number {
    const cov = covariance(a, b);
    const sdA = sampleStandardDeviation(a);
    const sdB = sampleStandardDeviation(b);

    if (sdA === 0 || sdB === 0) {
        return 0;
    }

    return cov / (sdA * sdB);
}

export function linearRegression(y: number[]): LinearRegressionResult {
    const cleanY = sanitizeFiniteValues(y);
    const n = cleanY.length;

    if (n < 2) {
        return { slope: 0, intercept: cleanY[0] || 0, rSquared: 0 };
    }

    const x = cleanY.map((_, index) => index);
    const xMean = mean(x);
    const yMean = mean(cleanY);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
        numerator += (x[i] - xMean) * (cleanY[i] - yMean);
        denominator += Math.pow(x[i] - xMean, 2);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    let sumSquaredResiduals = 0;
    let totalSumSquares = 0;

    for (let i = 0; i < n; i++) {
        const predicted = intercept + slope * x[i];
        sumSquaredResiduals += Math.pow(cleanY[i] - predicted, 2);
        totalSumSquares += Math.pow(cleanY[i] - yMean, 2);
    }

    const rSquared = totalSumSquares > 0 ? 1 - (sumSquaredResiduals / totalSumSquares) : 0;

    return {
        slope,
        intercept,
        rSquared
    };
}

export function coefficientOfVariation(values: number[]): number {
    const avg = mean(values);
    if (avg === 0) {
        return 0;
    }

    return sampleStandardDeviation(values) / Math.abs(avg);
}

export function simpleReturns(prices: number[]): number[] {
    const clean = sanitizeFiniteValues(prices);
    const returns: number[] = [];

    for (let i = 1; i < clean.length; i++) {
        const previous = clean[i - 1];
        if (previous !== 0) {
            returns.push((clean[i] - previous) / previous);
        }
    }

    return returns;
}

export function logReturns(prices: number[]): number[] {
    const clean = sanitizeFiniteValues(prices);
    const returns: number[] = [];

    for (let i = 1; i < clean.length; i++) {
        const previous = clean[i - 1];
        const current = clean[i];
        if (previous > 0 && current > 0) {
            returns.push(Math.log(current / previous));
        }
    }

    return returns;
}

export function cumulativeReturns(returns: number[]): number[] {
    const clean = sanitizeFiniteValues(returns);
    const output: number[] = [];
    let cumulative = 1;

    clean.forEach((value) => {
        cumulative *= (1 + value);
        output.push(cumulative - 1);
    });

    return output;
}

export function movingAverage(values: number[], windowSize: number): number[] {
    const clean = sanitizeFiniteValues(values);
    const window = Math.max(1, Math.floor(windowSize));
    const result: number[] = [];

    for (let i = 0; i < clean.length; i++) {
        if (i + 1 < window) {
            result.push(NaN);
            continue;
        }

        const slice = clean.slice(i + 1 - window, i + 1);
        result.push(mean(slice));
    }

    return result;
}

export function exponentialMovingAverage(values: number[], alpha = 0.2): number[] {
    const clean = sanitizeFiniteValues(values);
    if (clean.length === 0) {
        return [];
    }

    const boundedAlpha = Math.min(Math.max(alpha, 0.0001), 1);
    const result: number[] = [clean[0]];

    for (let i = 1; i < clean.length; i++) {
        result.push(boundedAlpha * clean[i] + (1 - boundedAlpha) * result[i - 1]);
    }

    return result;
}

export function rollingStandardDeviation(values: number[], windowSize: number): number[] {
    const clean = sanitizeFiniteValues(values);
    const window = Math.max(2, Math.floor(windowSize));
    const result: number[] = [];

    for (let i = 0; i < clean.length; i++) {
        if (i + 1 < window) {
            result.push(NaN);
            continue;
        }

        const slice = clean.slice(i + 1 - window, i + 1);
        result.push(sampleStandardDeviation(slice));
    }

    return result;
}

export function valueAtRisk(returns: number[], confidenceLevel = 0.95): number {
    const sorted = sanitizeFiniteValues(returns).sort((a, b) => a - b);
    if (sorted.length === 0) {
        return 0;
    }

    const tailProbability = 1 - confidenceLevel;
    const tailQuantile = quantile(sorted, tailProbability);
    return Math.abs(tailQuantile);
}

export function conditionalValueAtRisk(returns: number[], confidenceLevel = 0.95): number {
    const clean = sanitizeFiniteValues(returns);
    if (clean.length === 0) {
        return 0;
    }

    const threshold = -valueAtRisk(clean, confidenceLevel);
    const tail = clean.filter((value) => value <= threshold);

    if (tail.length === 0) {
        return 0;
    }

    return Math.abs(mean(tail));
}

export function downsideDeviation(returns: number[], targetReturn = 0): number {
    const clean = sanitizeFiniteValues(returns);
    if (clean.length === 0) {
        return 0;
    }

    const downsideSquares = clean.map((value) => Math.min(0, value - targetReturn)).map((value) => value * value);
    return Math.sqrt(mean(downsideSquares));
}

export function sortinoRatio(
    returns: number[],
    riskFreeRatePerPeriod = 0,
    targetReturn = 0,
    annualizationFactor = 252
): number {
    const avg = mean(returns);
    const dd = downsideDeviation(returns, targetReturn);

    if (dd === 0) {
        return 0;
    }

    return ((avg - riskFreeRatePerPeriod) / dd) * Math.sqrt(annualizationFactor);
}

export function beta(assetReturns: number[], benchmarkReturns: number[]): number {
    const benchmarkVariance = sampleVariance(benchmarkReturns);
    if (benchmarkVariance === 0) {
        return 0;
    }

    return covariance(assetReturns, benchmarkReturns) / benchmarkVariance;
}

export function informationRatio(
    assetReturns: number[],
    benchmarkReturns: number[],
    annualizationFactor = 252
): number {
    const pairs = pairedFiniteValues(assetReturns, benchmarkReturns);
    if (pairs.length < 2) {
        return 0;
    }

    const activeReturns = pairs.map((pair) => pair[0] - pair[1]);
    const trackingError = sampleStandardDeviation(activeReturns);
    if (trackingError === 0) {
        return 0;
    }

    return (mean(activeReturns) / trackingError) * Math.sqrt(annualizationFactor);
}

export function standardError(values: number[]): number {
    const clean = sanitizeFiniteValues(values);
    if (clean.length === 0) {
        return 0;
    }

    return sampleStandardDeviation(clean) / Math.sqrt(clean.length);
}

export function confidenceIntervalMean(values: number[], confidenceLevel = 0.95): ConfidenceInterval {
    const clean = sanitizeFiniteValues(values);
    const avg = mean(clean);
    const se = standardError(clean);

    // Normal approximation critical values for common confidence levels.
    let z = 1.96;
    if (confidenceLevel >= 0.99) {
        z = 2.576;
    } else if (confidenceLevel >= 0.95) {
        z = 1.96;
    } else if (confidenceLevel >= 0.90) {
        z = 1.645;
    }

    const margin = z * se;

    return {
        mean: avg,
        marginOfError: margin,
        lowerBound: avg - margin,
        upperBound: avg + margin,
        confidenceLevel
    };
}

export function oneSampleTStatistic(values: number[], hypothesizedMean = 0): number {
    const clean = sanitizeFiniteValues(values);
    if (clean.length < 2) {
        return 0;
    }

    const se = standardError(clean);
    if (se === 0) {
        return 0;
    }

    return (mean(clean) - hypothesizedMean) / se;
}
