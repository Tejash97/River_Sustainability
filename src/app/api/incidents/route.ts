import { NextRequest, NextResponse } from 'next/server';
import { searchDynamicPollutedSpots } from '@/lib/dynamicPollutionEngine';
import { INITIAL_LAT, INITIAL_LNG, INITIAL_CITY } from '@/data/seedIncidents';
import { Incident } from '@/types';

export const dynamic = 'force-dynamic';

// Storage for custom user-submitted reports
let customReports: Incident[] = [];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const city = searchParams.get('city') || INITIAL_CITY;
    const waterwaysParam = searchParams.get('waterways') || '';
    const detectedWaterways = waterwaysParam ? waterwaysParam.split(',').map((w) => w.trim()).filter(Boolean) : [];

    const lat = latStr ? parseFloat(latStr) : INITIAL_LAT;
    const lng = lngStr ? parseFloat(lngStr) : INITIAL_LNG;

    // Dynamically search real environmental news & geospatial waterbodies for ANY location worldwide
    const baseIncidents = await searchDynamicPollutedSpots(lat, lng, city, detectedWaterways);

    // Combine any user-submitted citizen reports near this coordinate
    const relevantCustom = customReports.filter((rep) => {
      const dLat = Math.abs(rep.lat - lat);
      const dLng = Math.abs(rep.lng - lng);
      return dLat < 0.25 && dLng < 0.25;
    });

    const allIncidents = [...relevantCustom, ...baseIncidents];

    return NextResponse.json({
      success: true,
      incidents: allIncidents,
      total: allIncidents.length,
      city,
      center: { lat, lng },
    });
  } catch (err: any) {
    console.error('Error in GET /api/incidents:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch dynamic incidents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.category || !body.lat || !body.lng) {
      return NextResponse.json(
        { error: 'Missing required incident fields: title, category, lat, lng' },
        { status: 400 }
      );
    }

    const newIncident: Incident = {
      id: `inc-user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: body.title,
      category: body.category,
      severity: Number(body.severity) || 3,
      description: body.description || '',
      lat: Number(body.lat),
      lng: Number(body.lng),
      reportedAt: new Date().toISOString(),
      reporterName: body.reporterName || 'Citizen Eco Guardian',
      waterbodyName: body.waterbodyName || 'Local Waterway',
      photoUrl: body.photoUrl,
      status: 'Unresolved',
      cleanTimeHours: 2.0,
      volunteersNeeded: 10,
      gearNeeded: ['Gloves', 'Pickers', 'Collection bags'],
      howToClean: 'Volunteer bank sweep. Pick solid waste into bags and notify municipal truck.',
    };

    customReports.unshift(newIncident);

    return NextResponse.json(
      {
        success: true,
        incident: newIncident,
        total: customReports.length,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error in POST /api/incidents:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit incident report' },
      { status: 500 }
    );
  }
}
