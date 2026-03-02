import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-3xl">🏥</span>
            <div>
              <h1 className="text-2xl font-bold text-primary">AyushScan AI</h1>
              <p className="text-sm text-gray-600">AI Diagnostic Triage for Rural Bharat</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 bg-aws-orange/10 px-3 py-1.5 rounded-full">
            <Zap className="w-4 h-4 text-aws-orange" />
            <span className="text-sm font-medium text-aws-orange">Powered by AWS</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
