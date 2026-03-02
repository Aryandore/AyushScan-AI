import { useState } from 'react';
import { FileText, Download, Printer, Loader } from 'lucide-react';
import { generateReport } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function ReferralReport({ assessmentId }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await generateReport(assessmentId);
      setReport(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const reportElement = document.getElementById('report-preview');
    if (!reportElement) return;

    try {
      const canvas = await html2canvas(reportElement);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`ayushscan-report-${assessmentId}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Medical Report</h2>
        <p className="text-gray-600">Generate a detailed report for healthcare providers</p>
      </div>

      {!report ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full px-6 py-4 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-medium"
        >
          {loading ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              Generating with Amazon Nova Pro...
            </>
          ) : (
            <>
              <FileText className="w-6 h-6" />
              📄 Generate Doctor Report
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          <div
            id="report-preview"
            className="border-2 border-gray-200 rounded-lg p-6 bg-white"
            dangerouslySetInnerHTML={{ __html: report.report_html }}
          />

          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              ⬇️ Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              🖨️ Print
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 bg-aws-orange/10 px-4 py-2 rounded-full">
            <span className="text-sm font-medium text-aws-orange">
              Saved to AWS S3
            </span>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-3">
            <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-800 font-medium">Generating with Amazon Nova Pro...</span>
          </div>
          <div className="flex items-center gap-3">
            <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-blue-800 font-medium">Saving to AWS S3...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReferralReport;
