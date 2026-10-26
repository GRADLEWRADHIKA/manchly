import React from 'react';

// OTA updates are Android-only (see OtaUpdateGate.android.tsx); other platforms render the app directly.
const OtaUpdateGate = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default OtaUpdateGate;
