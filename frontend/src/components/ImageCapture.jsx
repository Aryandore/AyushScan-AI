import { useState } from 'react';
import { Camera, Upload, X, Check, Loader } from 'lucide-react';
import { uploadImageToS3 } from '../services/s3Service';

function ImageCapture({ data, onChange }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(data?.preview || null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(data?.uploaded || false);
  const [s3Key, setS3Key] = useState(data?.s3Key || null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setUploaded(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const key = await uploadImageToS3(selectedFile);
      setS3Key(key);
      setUploaded(true);
      onChange({ preview, s3Key: key, uploaded: true });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploaded(false);
    setS3Key(null);
    onChange({ preview: null, s3Key: null, uploaded: false });
  };

  const handleSkip = () => {
    onChange({ skipped: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Visual Documentation</h2>
        <p className="text-gray-600">Upload or capture an image (optional)</p>
      </div>

      {!preview ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors">
              <Camera className="w-12 h-12 text-gray-400" />
              <span className="text-lg font-medium text-gray-700">Take Photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors">
              <Upload className="w-12 h-12 text-gray-400" />
              <span className="text-lg font-medium text-gray-700">Upload Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={handleSkip}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Skip - No Image
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain bg-gray-100"
            />
            {uploaded && (
              <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1.5 rounded-full flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Saved to AWS S3</span>
              </div>
            )}
          </div>

          {!uploaded ? (
            <div className="space-y-3">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Uploading to S3...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload to S3
                  </>
                )}
              </button>

              <button
                onClick={handleRemove}
                disabled={uploading}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Remove Image
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleRemove}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Change Image
              </button>
            </div>
          )}

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                <div className="flex-1">
                  <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 bg-aws-orange/10 px-3 py-1.5 rounded-full w-fit">
        <span className="text-sm font-medium text-aws-orange">AWS Rekognition</span>
      </div>
    </div>
  );
}

export default ImageCapture;
