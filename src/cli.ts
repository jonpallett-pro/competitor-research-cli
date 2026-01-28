#!/usr/bin/env node

import { Command } from 'commander';
import { config } from 'dotenv';
import chalk from 'chalk';
import { analyzeCommand } from './commands/analyze';
import { AnalyzeOptionsSchema } from './schemas/index';

// Load environment variables
config();

const program = new Command();

program
  .name('compete')
  .description('CLI tool for competitive research and analysis using AI')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze a website and generate a competitive analysis report')
  .argument('<url>', 'Target website URL to analyze')
  .option('-c, --competitors <number>', 'Number of competitors to analyze', '5')
  .option('-o, --output <path>', 'Output file path for the report')
  .option('-d, --depth <level>', 'Analysis depth: quick, normal, deep', 'normal')
  .action(async (url: string, options: Record<string, string>) => {
    // Validate URL
    try {
      new URL(url);
    } catch {
      console.error(chalk.red('Error: Invalid URL provided'));
      process.exit(1);
    }

    // Validate environment variables
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error(chalk.red('Error: ANTHROPIC_API_KEY environment variable is required'));
      console.error(chalk.dim('Set it in your environment or create a .env file'));
      process.exit(1);
    }

    // Parse and validate options
    const parsedOptions = AnalyzeOptionsSchema.safeParse({
      competitors: parseInt(options.competitors, 10),
      output: options.output,
      depth: options.depth,
    });

    if (!parsedOptions.success) {
      console.error(chalk.red('Error: Invalid options'));
      parsedOptions.error.errors.forEach((err) => {
        console.error(chalk.red(`  - ${err.path.join('.')}: ${err.message}`));
      });
      process.exit(1);
    }

    await analyzeCommand(url, parsedOptions.data);
  });

// Default action when no command is provided
program
  .argument('[url]', 'Target website URL to analyze')
  .option('-c, --competitors <number>', 'Number of competitors to analyze', '5')
  .option('-o, --output <path>', 'Output file path for the report')
  .option('-d, --depth <level>', 'Analysis depth: quick, normal, deep', 'normal')
  .action(async (url: string | undefined, options: Record<string, string>) => {
    if (!url) {
      program.help();
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      console.error(chalk.red('Error: Invalid URL provided'));
      process.exit(1);
    }

    // Validate environment variables
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error(chalk.red('Error: ANTHROPIC_API_KEY environment variable is required'));
      console.error(chalk.dim('Set it in your environment or create a .env file'));
      process.exit(1);
    }

    // Parse and validate options
    const parsedOptions = AnalyzeOptionsSchema.safeParse({
      competitors: parseInt(options.competitors, 10),
      output: options.output,
      depth: options.depth,
    });

    if (!parsedOptions.success) {
      console.error(chalk.red('Error: Invalid options'));
      parsedOptions.error.errors.forEach((err) => {
        console.error(chalk.red(`  - ${err.path.join('.')}: ${err.message}`));
      });
      process.exit(1);
    }

    await analyzeCommand(url, parsedOptions.data);
  });

program.parse();
