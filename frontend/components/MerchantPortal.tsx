import React, { useState } from 'react';
import MerchantDashboard from './MerchantDashboard.tsx';
import MerchantAuth from './MerchantAuth.tsx';

interface MerchantUser {
  id: string;
  businessName: string;
  email: string;
  verified: boolean;
}

const MerchantPortal: React.FC = () => {
  const [merchantUser, setMerchantUser] = useState<MerchantUser | null>(null);

  if (!merchantUser) {
    return <MerchantAuth onLogin={setMerchantUser} />;
  }

  return <MerchantDashboard merchant={merchantUser} onLogout={() => setMerchantUser(null)} />;
};

export default MerchantPortal;