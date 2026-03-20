import FileUploader from "../components/common/FileUploader";

export default function Upload() {
      const handleUploadSuccess = (data: {id:number, filename:string}) => {
            alert(`File Upload Success. Dataset ID:${data.id}\nFile:${data.filename}`);
      }
      return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-12">
          Upload Your Dataset
        </h1>

        <FileUploader onUploadSuccess={handleUploadSuccess} />
      </div>
    </div>
  );
}