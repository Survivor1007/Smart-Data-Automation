import { useState,useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { formatDate, formatNumber } from "../utils/format";


interface Dataset{
      id:number;
      filename: string;
      file_size_byte:number | null;
      uploaded_at:string;
      row_count:number|null;
      col_count:number|null;
}

export default function Datasets() {
      const [datasets, setDatasets] = useState<Dataset[]>([]);
      const [loading, setLoading] = useState<Boolean>(true);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
            const fetchDatasets = async () => {
                  try{
                  const response = await  api.get<Dataset[]>('/datasets');
                  setDatasets(response.data);
                  }
                  catch(err: any){
                        setError('Failed to load dataset. Please try again');
                        console.error(err);
                  }
                  finally{
                        setLoading(false);
                  }
            };
            fetchDatasets();
      },[]);

      if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading datasets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50  py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Your Datasets
          </h1>
          <Link
            to="/upload"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload New Dataset
          </Link>
        </div>

        {datasets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
            No datasets uploaded yet. Start by uploading one!
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size (bytes)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rows / Columns
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {datasets.map((ds) => (
                  <tr key={ds.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ds.filename}
                      </div>
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatNumber(ds.file_size_byte)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {ds.row_count != null && ds.col_count != null
                              ? `${formatNumber(ds.row_count)} × ${formatNumber(ds.col_count)}`
                              : '—'}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ds.uploaded_at)}
                        </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/datasets/${ds.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
