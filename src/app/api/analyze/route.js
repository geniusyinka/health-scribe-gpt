// src/app/api/analyze/route.js
import { NextResponse } from 'next/server';
import { analyzeJournalEntry } from '@/lib/analyzeJournal';

// Rate limiting setup
const RATE_LIMIT = 10; // requests per minute
const COOLDOWN = 60 * 1000; // 1 minute in milliseconds
let requestLog = new Map(); // Store IP -> timestamps

// Helper function to check rate limit
function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = requestLog.get(ip) || [];
  
  // Clean up old requests
  const recentRequests = userRequests.filter(
    timestamp => now - timestamp < COOLDOWN
  );
  
  // Check if under limit
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  // Update request log
  recentRequests.push(now);
  requestLog.set(ip, recentRequests);
  return true;
}

// Helper function to validate entry content
function validateContent(content) {
  if (!content || typeof content !== 'string') {
    return false;
  }
  // Ensure content isn't too long or too short
  if (content.length < 1 || content.length > 10000) {
    return false;
  }
  return true;
}

// Helper function to sanitize error messages
function sanitizeError(error) {
  // Remove any sensitive information from error messages
  const message = error.message || 'An error occurred';
  return message.replace(/key-[a-zA-Z0-9-_]+/g, 'KEY-REDACTED')
                .replace(/sk-[a-zA-Z0-9-_]+/g, 'SK-REDACTED');
}

// Retry mechanism for analysis
async function retryAnalysis(content, maxRetries = 2) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await analyzeJournalEntry(content);
      return result;
    } catch (error) {
      lastError = error;
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw lastError;
}
export async function POST(req) {
  try {
    // Get client IP (in production, you'd get this from headers)
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: COOLDOWN / 1000
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(COOLDOWN / 1000)
          }
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { content, id } = body;

    // Validate input
    if (!validateContent(content)) {
      return NextResponse.json(
        { 
          error: 'Invalid content provided',
          details: 'Content must be a string between 1 and 10000 characters'
        },
        { status: 400 }
      );
    }

    // Attempt analysis with retry mechanism
    try {
      const result = await retryAnalysis(content);

      // Validate result structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid analysis result structure');
      }

      if (!result.metrics || !result.insights || !result.suggestions) {
        throw new Error('Incomplete analysis result');
      }

      // Add metadata to response
      const response = {
        ...result,
        metadata: {
          analyzedAt: new Date().toISOString(),
          entryId: id,
          processingTime: process.hrtime()[0],
        }
      };

      return NextResponse.json(response);
    } catch (analysisError) {
      console.error('Analysis error:', analysisError);
      
      // Check for specific error types
      if (analysisError.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Service configuration error' },
          { status: 503 }
        );
      }

      if (analysisError.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 429 }
        );
      }

      // Generic analysis error
      return NextResponse.json(
        { 
          error: 'Analysis failed',
          details: sanitizeError(analysisError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: sanitizeError(error)
      },
      { status: 500 }
    );
  }
}

// Optional: Add HEAD method for health checks
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'x-api-version': '1.0',
      'x-api-status': 'healthy'
    }
  });
}