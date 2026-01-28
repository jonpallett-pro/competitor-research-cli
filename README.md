# Competitive Research CLI

A command-line tool that analyzes a website, identifies competitors via web search, and generates a structured Markdown competitive analysis report using AI.

## Features

- **Website Analysis**: Scrapes and analyzes target company websites
- **Competitor Discovery**: Uses AI-powered search to find relevant competitors
- **Deep Analysis**: Analyzes each competitor's positioning, strengths, and weaknesses
- **Market Insights**: Generates market analysis and segmentation
- **Strategic Recommendations**: Provides actionable insights and recommendations
- **Markdown Reports**: Outputs professional, structured reports

## Installation

```bash
# Clone the repository
cd competitor-research-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

## Configuration

Create a `.env` file in the project root:

```bash
# Copy the example
cp .env.example .env

# Edit with your API keys
```

Required API keys:

| Service | Environment Variable | Where to Get |
|---------|---------------------|--------------|
| Anthropic (Claude) | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |

## Usage

### Basic Usage

```bash
# Using npm
npm run dev -- https://example.com

# Using built version
compete analyze https://example.com

# Or with global link
compete https://linear.app
```

### Options

```bash
compete analyze <url> [options]

Options:
  -c, --competitors <number>  Number of competitors to analyze (default: 5)
  -o, --output <path>         Output file path for the report
  -d, --depth <level>         Analysis depth: quick, normal, deep (default: normal)
  -h, --help                  Display help
```

### Examples

```bash
# Analyze with 3 competitors
compete analyze https://linear.app --competitors 3

# Quick analysis with custom output
compete analyze https://notion.so --depth quick --output notion-report.md

# Deep analysis
compete analyze https://figma.com --depth deep --competitors 8
```

## Output

The tool generates a comprehensive Markdown report including:

1. **Executive Summary** - Key findings and competitive landscape overview
2. **Target Company Analysis** - Business model, value proposition, features
3. **Competitor Profiles** - Individual analysis for each competitor
4. **Competitive Landscape Table** - Side-by-side comparison
5. **Market Analysis** - Segmentation, positioning, trends
6. **Strategic Recommendations** - Opportunities, threats, and action items

## Architecture

```
competitor-research-cli/
├── src/
│   ├── cli.ts                    # CLI setup with Commander
│   ├── index.ts                  # Main entry
│   ├── commands/
│   │   └── analyze.ts            # Main analyze command
│   ├── services/
│   │   ├── scraper.service.ts    # Website content extraction
│   │   ├── search.service.ts     # Tavily search integration
│   │   ├── ai.service.ts         # Claude AI analysis
│   │   └── report.service.ts     # Markdown report generation
│   ├── prompts/
│   │   ├── business-analysis.ts  # Prompts for business understanding
│   │   └── competitor-analysis.ts # Prompts for competitor analysis
│   ├── schemas/
│   │   └── index.ts              # Zod schemas for validation
│   └── utils/
│       ├── rate-limiter.ts       # Bottleneck wrapper
│       └── logger.ts             # Pino logger
```

## Data Flow

```
User Input (URL)
       │
       ▼
┌─────────────────────────────────┐
│ 1. TARGET ANALYSIS              │
│    - Scrape website             │
│    - Extract content            │
│    - AI: Extract business profile│
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ 2. COMPETITOR DISCOVERY         │
│    - AI: Identify competitors   │
│      using Claude's knowledge   │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ 3. COMPETITOR ANALYSIS          │
│    - Scrape each competitor     │
│    - AI: Analyze positioning    │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ 4. MARKET SYNTHESIS             │
│    - AI: Compare all competitors│
│    - Generate strategic insights│
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ 5. REPORT GENERATION            │
│    - Compile Markdown report    │
│    - Write to file              │
└─────────────────────────────────┘
```

## Development

```bash
# Run in development mode
npm run dev -- https://example.com

# Build
npm run build

# Clean build
npm run clean && npm run build
```

## Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| CLI Framework | `commander` | Clean, lightweight, TypeScript support |
| Web Scraping | `cheerio` + `axios` | Fast HTML parsing, no browser overhead |
| AI Analysis | `@anthropic-ai/sdk` | Official SDK, also used for competitor discovery |
| Rate Limiting | `bottleneck` | Robust limiter for API calls |
| Validation | `zod` | Runtime type safety |
| Terminal UI | `chalk` + `ora` | Colors and spinners |

## License

MIT
