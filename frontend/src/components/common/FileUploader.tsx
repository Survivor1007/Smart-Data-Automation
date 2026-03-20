import { useState, type ChangeEvent } from "react";
import api from '../../services/api';

interface UploadResponse{
      id:number;
      filename:string;
      uploaded_at:string;
}

interface FileUploaderProps{
      onUploadSuccess: (data:UploadResponse) => void;
}

export default function FileUploader({onUploadSuccess} : FileUploaderProps){
      const [file, setFile] = useState<File | null>(null);
      const [uploading, setUploading] = useState<boolean>(false);
      const [error, setError] = useState<string | null>(null);

      const handleFileChange = (e : ChangeEvent<HTMLInputElement>) => {
            if(e.target.files?.[0]){
                  setFile(e.target.files[0]);
                  setError(null);
            }
      };

      const handleUpload = async () => {
            if (!file) return;

            setUploading(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', file);
            try{
                  const response = await api.post<UploadResponse>('/datasets/upload',formData, {
                  headers: {'Content-type': 'multipart/form-data'},
                  });

                  onUploadSuccess(response.data);
                  setFile(null);
            }
            catch(err: any){
                  setError(err.response?.data?.detail || 'Upload Failed. Pleases try again')
            }
            finally{
                  setUploading(false);
            }
      };

      return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-white shadow-sm">
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="text-lg font-medium text-blue-600 hover:text-blue-800 mb-2">
          Click to select a CSV or Excel file
        </div>
        <p className="text-sm text-gray-500">or drag & drop here</p>
      </label>

      {file && (
        <div className="mt-6 text-sm text-gray-700">
          Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
        </div>
      )}

      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`
          mt-6 px-8 py-3 rounded-lg font-medium text-white transition-colors
          ${!file || uploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }
        `}
      >
        {uploading ? 'Uploading...' : 'Upload Dataset'}
      </button>
    </div>
  );
}