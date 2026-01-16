import { instance } from '../utils/AxiosInstance';


export interface PanVerificationRequest {
  pan_number: string;
}

export interface PanVerificationResponse {
  success: boolean;
  data: {
    pan_details: {
      name: string;
      dob: string; 
      pan: string;
      father_name?: string;
      status?: string;
    };
    verification_id?: string;
  };
  message?: string;
}

export interface VerifyKYCRequest {
  pan_number: string;
  user_name: string;
  user_dob: string;
}

export interface VerifyKYCResponse {
  success: boolean;
  data: {
    verified: boolean;
    match_details: {
      name_match: boolean;
      dob_match: boolean;
    };
    pan_details: {
      name: string;
      dob: string;
      pan: string;
    };
  };
  message?: string;
}


export const verifyPAN = async (
  panNumber: string
): Promise<PanVerificationResponse> => {
  try {
    const response = await instance.post('api/kyc/verify-pan', {
      pan_number: panNumber,
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to verify PAN';
    throw new Error(errorMessage);
  }
};


export const verifyKYC = async (
  data: VerifyKYCRequest
): Promise<VerifyKYCResponse> => {
  try {
    const response = await instance.post('/kyc/verify', data);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      'KYC verification failed';
    throw new Error(errorMessage);
  }
};


export const getKYCStatus = async () => {
  try {
    const response = await instance.get('/kyc/status');
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to fetch KYC status';
    throw new Error(errorMessage);
  }
};

