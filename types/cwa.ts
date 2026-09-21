export interface CwaTimeParameter {
  parameterName: string;
  parameterValue?: string;
  parameterUnit?: string;
}

export interface CwaTimeSlot {
  startTime: string;
  endTime: string;
  parameter: CwaTimeParameter;
}

export interface CwaWeatherElement {
  elementName: 'Wx' | 'PoP' | 'MinT' | 'CI' | 'MaxT' | string;
  time: CwaTimeSlot[];
}

export interface CwaLocation {
  locationName: string;
  weatherElement: CwaWeatherElement[];
}

export interface CwaApiResponse {
  success: string;
  result: {
    resource_id: string;
    fields: Array<{ id: string; type: string }>;
  };
  records: {
    datasetDescription: string;
    location: CwaLocation[];
  };
}

export interface CwaTestResult {
  success: boolean;
  message: string;
  dataset: string;
  locationCount?: number;
  sampleLocation?: {
    locationName: string;
    elements: Array<{
      name: string;
      value: string;
      unit?: string;
      startTime: string;
      endTime: string;
    }>;
  };
  error?: string;
  timestamp: string;
}
