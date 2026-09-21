import { NextResponse } from 'next/server';
import { fetchCwaForecast, CwaApiError } from '@/lib/cwa';
import { CwaTestResult } from '@/types/cwa';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const rawData = await fetchCwaForecast();

    const locations = rawData.records.location || [];
    const firstLocation = locations[0];

    const sampleElements = firstLocation
      ? firstLocation.weatherElement.map((el) => {
          const firstSlot = el.time[0];
          return {
            name: el.elementName,
            value: firstSlot?.parameter.parameterName || '',
            unit: firstSlot?.parameter.parameterUnit || '',
            startTime: firstSlot?.startTime || '',
            endTime: firstSlot?.endTime || '',
          };
        })
      : [];

    const result: CwaTestResult = {
      success: true,
      message: 'CWA API connection verified successfully.',
      dataset: rawData.result?.resource_id || 'F-C0032-001',
      locationCount: locations.length,
      sampleLocation: firstLocation
        ? {
            locationName: firstLocation.locationName,
            elements: sampleElements,
          }
        : undefined,
      timestamp,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const statusCode = error instanceof CwaApiError && error.statusCode ? error.statusCode : 500;
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error occurred.';

    const failureResult: CwaTestResult = {
      success: false,
      message: 'Failed to retrieve data from CWA API.',
      dataset: 'F-C0032-001',
      error: errorMessage,
      timestamp,
    };

    return NextResponse.json(failureResult, { status: statusCode });
  }
}
