import { NextResponse } from 'next/server';
import { secureLog, secureError } from '@/utils/logger';

export async function POST(request) {
  try {
    const { query } = await request.json();
    
    secureLog('API Route called with query:', query);
    
    if (!query || query.length < 3) {
      secureLog('Query too short, returning empty results');
      return NextResponse.json({ places: [], message: 'Query too short' });
    }

    // Validate Google API key
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!googleApiKey) {
      secureError('Google Places API key not configured');
      return NextResponse.json({ places: [], error: 'API configuration error' }, { status: 500 });
    }

    // Call Google Places API server-side (no CORS issues)
    const googleResponse = await fetch(`https://places.googleapis.com/v1/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleApiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.addressComponents'
      },
      body: JSON.stringify({
        textQuery: `${query} school`,
        maxResultCount: 10
      })
    });

    secureLog('Google API response status:', googleResponse.status);

    if (googleResponse.ok) {
      const data = await googleResponse.json();
      secureLog('Google API returned places:', data.places?.length || 0);
      return NextResponse.json(data);
    } else {
      const errorText = await googleResponse.text();
      secureError('Google Places API error:', googleResponse.status, errorText);
      return NextResponse.json({ places: [], error: 'Google API error' });
    }

  } catch (error) {
    secureError('Error in school search API:', error);
    return NextResponse.json({ places: [], error: error.message });
  }
} 