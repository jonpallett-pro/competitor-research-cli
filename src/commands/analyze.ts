import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import type { AnalyzeOptions, CompetitorAnalysis } from '../schemas/index';
import { ScraperService } from '../services/scraper.service';
import { AIService } from '../services/ai.service';
import { ReportService } from '../services/report.service';
import logger from '../utils/logger';

export async function analyzeCommand(
  targetUrl: string,
  options: AnalyzeOptions
): Promise<void> {
  const spinner = ora();
  const scraper = new ScraperService();
  const ai = new AIService();
  const report = new ReportService();

  console.log(chalk.bold('\nCompetitive Research CLI'));
  console.log(chalk.dim('═'.repeat(50)));
  console.log(chalk.cyan(`Target: ${targetUrl}`));
  console.log(chalk.cyan(`Competitors: ${options.competitors}`));
  console.log(chalk.cyan(`Depth: ${options.depth}`));
  console.log(chalk.dim('═'.repeat(50)) + '\n');

  try {
    // Step 1: Scrape target website
    spinner.start(chalk.yellow('Analyzing target website...'));
    const targetContent = await scraper.scrape(targetUrl);
    spinner.succeed(chalk.green(`Scraped target: ${targetContent.title}`));

    // Step 2: Extract business profile using AI
    spinner.start(chalk.yellow('Extracting business profile...'));
    const targetProfile = await ai.extractBusinessProfile(targetUrl, targetContent);
    spinner.succeed(chalk.green(`Identified: ${targetProfile.companyName} (${targetProfile.industry})`));

    // Step 3: Identify competitors using AI knowledge
    spinner.start(chalk.yellow('Identifying competitors...'));
    const competitors = await ai.inferCompetitors(targetProfile, options.competitors);
    spinner.succeed(chalk.green(`Identified ${competitors.length} direct competitors`));

    if (competitors.length === 0) {
      console.log(chalk.yellow('\nNo competitors found. Try different search terms or a different URL.'));
      return;
    }

    // Display competitors
    console.log(chalk.bold('\nCompetitors identified:'));
    competitors.forEach((c, i) => {
      console.log(chalk.cyan(`  ${i + 1}. ${c.name} (${c.relevanceScore}% relevance)`));
      console.log(chalk.dim(`     ${c.url}`));
    });
    console.log('');

    // Step 6: Scrape competitor websites
    spinner.start(chalk.yellow('Scraping competitor websites...'));
    const competitorUrls = competitors.map((c) => c.url);
    const competitorContents = await scraper.scrapeMultiple(competitorUrls);
    spinner.succeed(chalk.green(`Scraped ${competitorContents.size} competitor websites`));

    // Step 7: Analyze each competitor
    spinner.start(chalk.yellow('Analyzing competitors...'));
    const competitorAnalyses: CompetitorAnalysis[] = [];
    let analyzed = 0;

    for (const competitor of competitors) {
      const content = competitorContents.get(competitor.url);
      if (content) {
        spinner.text = chalk.yellow(`Analyzing ${competitor.name} (${++analyzed}/${competitors.length})...`);
        try {
          const analysis = await ai.analyzeCompetitor(competitor.url, content);
          competitorAnalyses.push(analysis);
        } catch (error) {
          logger.warn({ competitor: competitor.name, error }, 'Failed to analyze competitor');
        }
      }
    }
    spinner.succeed(chalk.green(`Analyzed ${competitorAnalyses.length} competitors`));

    if (competitorAnalyses.length === 0) {
      console.log(chalk.yellow('\nCould not analyze any competitors. Please try again.'));
      return;
    }

    // Step 8: Generate market analysis
    spinner.start(chalk.yellow('Generating market analysis...'));
    const marketAnalysis = await ai.generateMarketAnalysis(targetProfile, competitorAnalyses);
    spinner.succeed(chalk.green('Market analysis complete'));

    // Step 9: Generate strategic recommendations
    spinner.start(chalk.yellow('Generating strategic recommendations...'));
    const recommendations = await ai.generateStrategicRecommendations(
      targetProfile,
      competitorAnalyses,
      marketAnalysis
    );
    spinner.succeed(chalk.green('Strategic recommendations complete'));

    // Step 10: Generate report
    spinner.start(chalk.yellow('Generating report...'));
    const reportContent = report.generateReport(
      targetUrl,
      targetProfile,
      competitorAnalyses,
      marketAnalysis,
      recommendations
    );

    // Determine output path
    const outputPath = options.output || `${targetProfile.companyName.toLowerCase().replace(/\s+/g, '-')}-competitive-analysis.md`;
    const absolutePath = path.resolve(outputPath);

    await fs.writeFile(absolutePath, reportContent, 'utf-8');
    spinner.succeed(chalk.green('Report generated'));

    // Final summary
    console.log(chalk.dim('\n' + '═'.repeat(50)));
    console.log(chalk.bold.green('Analysis Complete!'));
    console.log(chalk.dim('═'.repeat(50)));
    console.log(chalk.cyan(`Report saved to: ${absolutePath}`));
    console.log(chalk.dim(`\nAnalyzed ${targetProfile.companyName} against ${competitorAnalyses.length} competitors`));

    // Quick summary
    console.log(chalk.bold('\nTop Opportunities:'));
    recommendations.opportunities
      .filter((o) => o.priority === 'high')
      .slice(0, 3)
      .forEach((o) => console.log(chalk.green(`  • ${o.title}`)));

    console.log(chalk.bold('\nKey Threats:'));
    recommendations.threats
      .filter((t) => t.severity === 'high')
      .slice(0, 3)
      .forEach((t) => console.log(chalk.red(`  • ${t.title}`)));

  } catch (error) {
    spinner.fail(chalk.red('Analysis failed'));
    if (error instanceof Error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      logger.error({ error }, 'Analysis failed');
    }
    process.exit(1);
  }
}
