import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function GET() {
  try {
    // Check if API key is set
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
    }

    // Test the connection
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "OK"' }],
    });

    const text = response.content[0];
    return NextResponse.json({
      success: true,
      response: text,
      keyPrefix: apiKey.slice(0, 10) + '...',
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      error: error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
