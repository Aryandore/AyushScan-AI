import { useNavigate } from 'react-router-dom';
import { Mic, Camera, Brain, FileText, ArrowRight } from 'lucide-react';
import { setMockType } from '../services/api';

function Home() {
  const navigate = useNavigate();

  const handleDemoClick = (level) => {
    setMockType(level);
    navigate(`/assessment?demo=${level}`);
  };

  const awsServices = [
    'Amazon Bedrock',
    'AWS Rekognition',
    'AWS Transcribe',
    'AWS DynamoDB',
    'AWS S3',
    'AWS Lambda',
    'API Gateway',
    'AWS Amplify',
    'CloudWatch'
  ];

  const features = [
    {
      icon: Mic,
      title: 'Voice Symptoms',
      description: 'Record symptoms in any Indian language',
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      icon: Camera,
      title: 'Visual Analysis',
      description: 'AWS Rekognition analyzes medical images',
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      icon: Brain,
      title: 'AI Triage',
      description: 'Amazon Nova Pro provides instant assessment',
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      icon: FileText,
      title: 'Doctor Report',
      description: 'Generate and save reports to S3',
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
            AyushScan AI — नमस्ते 🙏
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto">
            Empowering 600,000+ ASHA Workers with AI
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-primary">6 Lakh</div>
              <div className="text-gray-600 mt-2">ASHA Workers</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-emergency-red">1:10,000</div>
              <div className="text-gray-600 mt-2">Doctor-Patient Ratio</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl font-bold text-aws-orange">9 Services</div>
              <div className="text-gray-600 mt-2">AWS Technologies</div>
            </div>
          </div>
        </div>
      </section>

      {/* AWS Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Powered by AWS Services
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {awsServices.map((service, index) => (
            <span
              key={index}
              className="px-4 py-2 bg-aws-orange/10 text-aws-orange font-medium rounded-full border-2 border-aws-orange/20"
            >
              {service}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 ${feature.bg} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Demo Buttons */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Try Demo Cases</h2>
            <p className="text-gray-600">Experience the AI triage system with sample scenarios</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => handleDemoClick('green')}
              className="p-6 border-2 border-primary rounded-lg hover:bg-primary/5 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🟢</div>
              <div className="font-semibold text-gray-900 mb-1">Mild Case</div>
              <div className="text-sm text-gray-600">Common cold, mild fever</div>
            </button>

            <button
              onClick={() => handleDemoClick('yellow')}
              className="p-6 border-2 border-warning-amber rounded-lg hover:bg-warning-amber/5 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🟡</div>
              <div className="font-semibold text-gray-900 mb-1">Moderate Case</div>
              <div className="text-sm text-gray-600">Possible dengue fever</div>
            </button>

            <button
              onClick={() => handleDemoClick('red')}
              className="p-6 border-2 border-emergency-red rounded-lg hover:bg-emergency-red/5 transition-colors text-left"
            >
              <div className="text-2xl mb-2">🔴</div>
              <div className="font-semibold text-gray-900 mb-1">Emergency Case</div>
              <div className="text-sm text-gray-600">Cardiac emergency</div>
            </button>
          </div>

          <div className="pt-4">
            <button
              onClick={() => navigate('/assessment')}
              className="w-full px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center justify-center gap-3 text-lg font-semibold"
            >
              🚀 Start Real Assessment
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-gray-600">
        <p>Built for rural healthcare in India 🇮🇳</p>
        <p className="mt-2 text-sm">Empowering ASHA workers with AI-powered diagnostic triage</p>
      </footer>
    </div>
  );
}

export default Home;
