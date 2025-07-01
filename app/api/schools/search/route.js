import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { query } = await request.json();
    
    console.log('API Route called with query:', query);
    
    if (!query || query.length < 3) {
      console.log('Query too short, returning empty results');
      return NextResponse.json({ places: [], message: 'Query too short' });
    }

    // Call Google Places API server-side (no CORS issues)
    const googleResponse = await fetch(`https://places.googleapis.com/v1/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': 'AIzaSyDFMbLppF6z6D13G9GhXgMyFFTJPhbufVU',
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.addressComponents'
      },
      body: JSON.stringify({
        textQuery: `${query} school`,
        maxResultCount: 10
      })
    });

    console.log('Google API response status:', googleResponse.status);

    if (googleResponse.ok) {
      const data = await googleResponse.json();
      console.log('Google API returned places:', data.places?.length || 0);
      return NextResponse.json(data);
    } else {
      const errorText = await googleResponse.text();
      console.error('Google Places API error:', googleResponse.status, errorText);
      return NextResponse.json({ places: [], error: 'Google API error' });
    }

  } catch (error) {
    console.error('Error in school search API:', error);
    return NextResponse.json({ places: [], error: error.message });
  }
} 