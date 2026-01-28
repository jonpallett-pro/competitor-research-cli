import type {
  BusinessProfile,
  CompetitorAnalysis,
  MarketAnalysis,
  StrategicRecommendations,
} from '../schemas/index';

export class ReportService {
  generateReport(
    targetUrl: string,
    targetProfile: BusinessProfile,
    competitorAnalyses: CompetitorAnalysis[],
    marketAnalysis: MarketAnalysis,
    recommendations: StrategicRecommendations
  ): string {
    const sections = [
      this.generateHeader(targetProfile),
      this.generateExecutiveSummary(recommendations),
      this.generateTargetAnalysis(targetUrl, targetProfile),
      this.generateCompetitorProfiles(competitorAnalyses),
      this.generateCompetitiveLandscapeTable(targetProfile, competitorAnalyses),
      this.generateMarketAnalysisSection(marketAnalysis),
      this.generateStrategicRecommendationsSection(recommendations),
      this.generateFooter(),
    ];

    return sections.join('\n\n---\n\n');
  }

  private generateHeader(profile: BusinessProfile): string {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `# Competitive Analysis Report: ${profile.companyName}

**Industry:** ${profile.industry}
**Generated:** ${date}

> This report provides a comprehensive analysis of ${profile.companyName}'s competitive landscape, market positioning, and strategic recommendations.`;
  }

  private generateExecutiveSummary(recommendations: StrategicRecommendations): string {
    return `## 1. Executive Summary

${recommendations.summary}

### Key Opportunities
${recommendations.opportunities
  .filter((o) => o.priority === 'high')
  .slice(0, 3)
  .map((o) => `- **${o.title}:** ${o.description}`)
  .join('\n')}

### Critical Threats
${recommendations.threats
  .filter((t) => t.severity === 'high')
  .slice(0, 3)
  .map((t) => `- **${t.title}:** ${t.description}`)
  .join('\n')}`;
  }

  private generateTargetAnalysis(url: string, profile: BusinessProfile): string {
    return `## 2. Target Company Analysis

### Company Overview
**Company:** ${profile.companyName}
**Website:** ${url}
**Industry:** ${profile.industry}

${profile.description}

### Value Proposition
${profile.valueProposition}

### Target Audience
${profile.targetAudience}

### Key Features
${profile.keyFeatures.map((f) => `- ${f}`).join('\n')}

${profile.pricingModel ? `### Pricing Model\n${profile.pricingModel}` : ''}

${profile.techStack && profile.techStack.length > 0 ? `### Technology Stack\n${profile.techStack.map((t) => `- ${t}`).join('\n')}` : ''}`;
  }

  private generateCompetitorProfiles(analyses: CompetitorAnalysis[]): string {
    const profiles = analyses.map((analysis, index) => {
      return `### ${index + 1}. ${analysis.companyName}

**Website:** ${analysis.url}

${analysis.overview}

#### Strengths
${analysis.strengths.map((s) => `- ${s}`).join('\n')}

#### Weaknesses
${analysis.weaknesses.map((w) => `- ${w}`).join('\n')}

#### Key Features
${analysis.keyFeatures.map((f) => `- ${f}`).join('\n')}

#### Pricing
${analysis.pricingModel}

#### Target Market
${analysis.targetMarket}

#### Key Differentiators
${analysis.differentiators.map((d) => `- ${d}`).join('\n')}`;
    });

    return `## 3. Competitor Profiles

${profiles.join('\n\n')}`;
  }

  private generateCompetitiveLandscapeTable(
    target: BusinessProfile,
    competitors: CompetitorAnalysis[]
  ): string {
    const allCompanies = [
      { name: `${target.companyName} (Target)`, features: target.keyFeatures.slice(0, 3).join(', '), pricing: target.pricingModel || 'N/A' },
      ...competitors.map((c) => ({
        name: c.companyName,
        features: c.keyFeatures.slice(0, 3).join(', '),
        pricing: c.pricingModel,
      })),
    ];

    const table = `| Company | Key Features | Pricing |
|---------|--------------|---------|
${allCompanies.map((c) => `| ${c.name} | ${c.features} | ${c.pricing} |`).join('\n')}`;

    return `## 4. Competitive Landscape Overview

${table}`;
  }

  private generateMarketAnalysisSection(analysis: MarketAnalysis): string {
    const segments = analysis.marketSegments
      .map((s) => `#### ${s.name}\n${s.description}\n\n**Key Players:** ${s.players.join(', ')}`)
      .join('\n\n');

    return `## 5. Market Analysis

### Market Overview
${analysis.marketOverview}

### Market Segments
${segments}

### Competitive Positioning
${analysis.competitivePositioning}

### Market Trends
${analysis.marketTrends.map((t) => `- ${t}`).join('\n')}

### Entry Barriers
${analysis.entryBarriers.map((b) => `- ${b}`).join('\n')}`;
  }

  private generateStrategicRecommendationsSection(recommendations: StrategicRecommendations): string {
    const opportunities = recommendations.opportunities
      .sort((a, b) => {
        const priority = { high: 0, medium: 1, low: 2 };
        return priority[a.priority] - priority[b.priority];
      })
      .map((o) => `#### ${o.title} [${o.priority.toUpperCase()} PRIORITY]\n${o.description}`)
      .join('\n\n');

    const threats = recommendations.threats
      .sort((a, b) => {
        const severity = { high: 0, medium: 1, low: 2 };
        return severity[a.severity] - severity[b.severity];
      })
      .map((t) => `#### ${t.title} [${t.severity.toUpperCase()} SEVERITY]\n${t.description}`)
      .join('\n\n');

    const recs = recommendations.recommendations
      .map((r) => `#### ${r.title}\n${r.description}\n\n**Action Items:**\n${r.actionItems.map((a) => `- ${a}`).join('\n')}`)
      .join('\n\n');

    return `## 6. Strategic Recommendations

### Opportunities
${opportunities}

### Threats
${threats}

### Recommendations
${recs}`;
  }

  private generateFooter(): string {
    return `## About This Report

This competitive analysis was generated using AI-powered research and analysis. The insights are based on publicly available information from company websites and may not reflect the most current state of each company.

**Methodology:**
1. Target company website analysis
2. AI-powered competitor discovery via web search
3. Individual competitor website analysis
4. Market synthesis and strategic recommendations

**Disclaimer:** This report is for informational purposes only. Always verify critical business decisions with additional research and professional consultation.

---

*Generated by Competitive Research CLI*`;
  }
}

export const reportService = new ReportService();
