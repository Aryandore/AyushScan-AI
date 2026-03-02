import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader } from 'lucide-react';
import PatientForm from '../components/PatientForm';
import VoiceRecorder from '../components/VoiceRecorder';
import ImageCapture from '../components/ImageCapture';
import { submitAssessment } from '../services/api';

function Assessment() {
  const navigate = useNavigate();
  const location = useLocation();
  const demoMode = location.state?.demoMode;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  
  const [assessmentData, setAssessmentData] = useState({
    patient: {},
    voice: {},
    image: {}
  });

  useEffect(() => {
    if (demoMode) {
      // Pre-fill demo data
      setAssessmentData({
        patient: {
          name: 'Demo Patient',
          age: '45',
          gender: 'male',
          location: 'Rural Village'
        },
        voice: {
          language: 'en-IN',
          transcript: demoMode === 'RED' 
            ? 'Patient has severe chest pain, left arm pain, difficulty breathing, and sweating'
            : demoMode === 'YELLOW'
            ? 'Patient has high fever 103F, severe headache, body pain, and skin rash'
            : 'Patient has mild fever, common cold symptoms, and fatigue'
        },
        image: { skipped: true }
      });
    }
  }, [demoMode]);

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Simulate processing steps
      setLoadingStep('🔍 AWS Rekognition analyzing image...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setLoadingStep('🧠 Amazon Nova Pro processing symptoms...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLoadingStep('💾 Saving to AWS DynamoDB...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLoadingStep('✅ Analysis complete!');
      
      // Submit assessment
      const response = await submitAssessment({
        ...assessmentData,
        mockLevel: demoMode
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to results
      navigate('/results', { state: { result: response.data } });
    } catch (error) {
      console.error('Assessment submission failed:', error);
      alert('Failed to submit assessment. Please try again.');
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true; // Patient form is optional
      case 2:
        return assessmentData.voice?.transcript?.trim().length > 0;
      case 3:
        return assessmentData.image?.uploaded || assessmentData.image?.skipped;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span className={currentStep >= 1 ? 'text-primary font-medium' : ''}>Patient</span>
            <span className={currentStep >= 2 ? 'text-primary font-medium' : ''}>Symptoms</span>
            <span className={currentStep >= 3 ? 'text-primary font-medium' : ''}>Image</span>
            <span className={currentStep >= 4 ? 'text-primary font-medium' : ''}>Review</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {currentStep === 1 && (
            <PatientForm
              data={assessmentData.patient}
              onChange={(data) => setAssessmentData({ ...assessmentData, patient: data })}
            />
          )}

          {currentStep === 2 && (
            <VoiceRecorder
              data={assessmentData.voice}
              onChange={(data) => setAssessmentData({ ...assessmentData, voice: data })}
            />
          )}

          {currentStep === 3 && (
            <ImageCapture
              data={assessmentData.image}
              onChange={(data) => setAssessmentData({ ...assessmentData, image: data })}
            />
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Assessment</h2>
                <p className="text-gray-600">Please review the information before submitting</p>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Patient Information</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    {assessmentData.patient.name && <p>Name: {assessmentData.patient.name}</p>}
                    {assessmentData.patient.age && <p>Age: {assessmentData.patient.age}</p>}
                    {assessmentData.patient.gender && <p>Gender: {assessmentData.patient.gender}</p>}
                    {assessmentData.patient.location && <p>Location: {assessmentData.patient.location}</p>}
                    {!assessmentData.patient.name && !assessmentData.patient.age && (
                      <p className="text-gray-400 italic">No patient information provided</p>
                    )}
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Symptoms</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {assessmentData.voice.transcript || 'No symptoms recorded'}
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Image</h3>
                  {assessmentData.image.uploaded ? (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <span>✅</span>
                      <span>Image uploaded to S3</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No image provided</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader className="w-6 h-6 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Submit Assessment
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="flex gap-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center justify-center">
              <Loader className="w-12 h-12 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{loadingStep}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assessment;
