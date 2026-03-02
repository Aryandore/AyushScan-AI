import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TriageResult from '../components/TriageResult';
import ReferralReport from '../components/ReferralReport';

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Assessment Data</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            New Assessment
          </button>
          <div className="text-sm text-gray-600">
            Assessment #{result.assessment_id}
          </div>
        </div>

        {/* Triage Result */}
        <TriageResult result={result} />

        {/* Referral Report */}
        <ReferralReport assessmentId={result.assessment_id} />

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            ← New Assessment
          </button>
        </div>
      </div>
    </div>
  );
}

export default Results;
