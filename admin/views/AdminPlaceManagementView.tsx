import React, { useState, useEffect } from 'react';
import { Colors } from '../../constants.ts';
import { withApiBase } from '../../services/config';

interface TripPlan {
  _id: string;
  userId: string;
  tripTitle: string;
  destination: string;
  duration: string;
  dailyPlans: any[];
  createdAt: string;
}

const AdminPlaceManagementView: React.FC = () => {
  const [tripPlans, setTripPlans] = useState<TripPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const cardStyle: React.CSSProperties = {
    backgroundColor: Colors.cardBackground,
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: Colors.boxShadow,
  };

  useEffect(() => {
    fetchTripPlans();
  }, []);

  const fetchTripPlans = async () => {
    try {
      // Get all users first to get trip plans
  const usersRes = await fetch(withApiBase('/api/users'));
      const users = await usersRes.json();
      
      const allTripPlans: TripPlan[] = [];
      
      // Fetch trip plans for each user
      for (const user of users) {
        try {
          const tripsRes = await fetch(withApiBase(`/api/users/${user._id}/trips`));
          const userTrips = await tripsRes.json();
          allTripPlans.push(...userTrips);
        } catch (err) {
          // Skip if user has no trips
        }
      }
      
      setTripPlans(allTripPlans);
    } catch (error) {
      console.error('Error fetching trip plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTripPlan = async (tripPlanId: string) => {
    if (!confirm('Are you sure you want to delete this trip plan?')) return;
    
    try {
      // Note: No delete endpoint available for trip plans
      alert('Delete functionality not implemented in backend');
      return;
  await fetch(withApiBase(`/api/trips/${tripPlanId}`), {
        method: 'DELETE'
      });
      setTripPlans(tripPlans.filter(plan => plan._id !== tripPlanId));
    } catch (error) {
      console.error('Error deleting trip plan:', error);
    }
  };

  const filteredTripPlans = tripPlans.filter(plan => 
    (plan.tripTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plan.destination || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="animate-fadeInUp flex justify-center items-center h-64">
        <div className="text-lg" style={{ color: Colors.text }}>Loading trip plans...</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <h1 className="text-2xl font-bold mb-6" style={{ color: Colors.text }}>Trip Plan Management</h1>
      
      <div style={cardStyle}>
        <div className="flex justify-between items-center mb-4">
          <input 
            type="text" 
            placeholder="Search trip plans by title, user, or places..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2.5 border rounded-xl shadow-sm focus:outline-none focus:ring-2 w-1/2"
            style={{ 
              color: Colors.text,
              backgroundColor: Colors.inputBackground,
              boxShadow: Colors.boxShadowSoft,
              borderColor: Colors.cardBorder,
            }}
          />
          <div className="text-sm" style={{ color: Colors.text_secondary }}>
            Total Trip Plans: {filteredTripPlans.length}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg" style={{border: `1px solid ${Colors.cardBorder}`}}>
          <table className="min-w-full divide-y" style={{borderColor: Colors.cardBorder}}>
            <thead style={{backgroundColor: Colors.inputBackground}}>
              <tr>
                {['Title', 'Destination', 'Duration', 'Created', 'Actions'].map(header => (
                  <th key={header} scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: Colors.text_secondary}}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{backgroundColor: Colors.cardBackground, borderColor: Colors.cardBorder}} className="divide-y">
              {filteredTripPlans.map(plan => (
                <tr key={plan._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium" style={{color: Colors.text}}>{plan.tripTitle || 'Untitled'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm" style={{color: Colors.text_secondary}}>{plan.destination || 'Unknown'}</td>
                  <td className="px-5 py-3.5 text-sm" style={{color: Colors.text_secondary}}>
                    {plan.duration || 'Not specified'}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm" style={{color: Colors.text_secondary}}>
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => deleteTripPlan(plan._id)}
                      className="text-xs px-2 py-1 rounded" 
                      style={{color: Colors.accentError, backgroundColor: `${Colors.accentError}10`}}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-right" style={{color: Colors.text_secondary}}>
          Real trip plan data from database. Use search to filter plans.
        </p>
      </div>
    </div>
  );
};

export default AdminPlaceManagementView;