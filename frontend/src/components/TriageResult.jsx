import { AlertCircle, CheckCircle, AlertTriangle, Phone } from 'lucide-react';

function TriageResult({ result }) {
  const getTriageConfig = (level) => {
    switch (level) {
      case 'RED':
        return {
          bg: 'bg-emergency-red',
          text: 'text-white',
          border: 'border-emergency-red pulse-border',
          icon: AlertCircle,
          title: '🚨 EMERGENCY - GO TO HOSPITAL NOW',
          showEmergencyBanner: true
        };
      case 'YELLOW':
        return {
          bg: 'bg-warning-amber',
          text: 'text-gray-900',
          border: 'border-warning-amber',
          icon: AlertTriangle,
          title: '⚠️ VISIT CLINIC SOON',
          showEmergencyBanner: false
        };
      case 'GREEN':
      default:
        return {
          bg: 'bg-primary',
          text: 'text-white',
          border: 'border-primary',
          icon: CheckCircle,
          title: '✅ MONITOR AT HOME',
          showEmergencyBanner: false
        };
    }
  };

  const config = getTriageConfig(result.triage_level);
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {config.showEmergencyBanner && (
        <div className="sticky top-0 z-10 bg-emergency-red text-white px-6 py-4 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <Phone className="w-6 h-6" />
            <span className="text-xl font-bold">📞 CALL 108 IMMEDIATELY</span>
          </div>
        </div>
      )}

      <div className={`${config.bg} ${config.text} rounded-lg p-6 border-4 ${config.border}`}>
        <div className="flex items-center gap-3 mb-4">
          <Icon className="w-8 h-8" />
          <h2 className="text-2xl font-bold">{config.title}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium opacity-90">Confidence Score</span>
              <span className="text-lg font-bold">{result.confidence_score}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${result.confidence_score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Symptoms Detected</h3>
          <div className="flex flex-wrap gap-2">
            {result.symptoms_detected.map((symptom, index) => (
              <span
                key={index}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  result.triage_level === 'RED'
                    ? 'bg-red-100 text-red-800'
                    : result.triage_level === 'YELLOW'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {symptom}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Primary Concern</h3>
          <p className="text-gray-800 font-medium text-lg">{result.primary_concern}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommended Action</h3>
          <p className="text-gray-800 font-medium">{result.recommended_action}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Why This Assessment?</h3>
          <p className="text-blue-800 text-sm">{result.urgency_reason}</p>
        </div>

        {result.follow_up_questions && result.follow_up_questions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Follow-up Questions</h3>
            <ol className="space-y-2">
              {result.follow_up_questions.map((question, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="text-gray-800">{question}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 bg-aws-orange/10 px-4 py-2 rounded-full">
          <span className="text-sm font-medium text-aws-orange">
            ⚡ Powered by Amazon Nova Pro on AWS Bedrock
          </span>
        </div>
      </div>
    </div>
  );
}

export default TriageResult;
