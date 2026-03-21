import { useEffect, useState} from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { type JobStatus, getStatusColor, getStatusLabel } from '../types/job';
import Modal from "../components/common/Modal";
import CleaningModal from "../components/cleaning/CleaningModal";

interface   DatasetDetail{
      id:number;
      filename:string;
      file_size_byte:number|null;
      uploaded_at:string;
      row_count:number | null;
      col_count:number|null;
}

interface PreviewData{
      columns:string[];
      dtypes:string[];
      sample_rows: Array<Record<string, any>>;
      total_rows?:number;
}

interface AnalysisReport{
      shape:{rows:number, columns:number};
      missing:{counts:Record<string, any>, percentage:Record<string, any>};
      duplicates:{count:number, percentage:number};
      numeric_stats?:Record<string, Record<string, any>>;
      categorial_top_values:Record<string, {top_values:Record<string,number>;unique_count:number}>;
}

export default function DatasetDetail(){
      const {id} = useParams<{id:string}>();
      const datasetId = Number(id);

      const [dataset, setDataset] = useState<DatasetDetail| null>(null);
      const [preview, setPreview] = useState<PreviewData|null>(null);
      const [analysis, setAnalysis] = useState<AnalysisReport|null>(null);
      const [loading, setLoading] = useState<boolean>(true);
      const [error, setError] = useState<string|null>(null);
      const [jobs, setJobs] = useState<any[]>([]);
      const [jobsLoading, setJobsLoading] = useState<boolean>(true);
      const [showCleanModal, setShowCleanModal]  = useState<boolean>(false);
      const [selectedOps, setSelectedOps] = useState<string[]>([]);
      const [showCleaningModal, setShowCleaningModal] =useState(false);
      const [previewColumns,setPreviewColumns] = useState<string[]>([])
      

      const handleCleanSubmit = async () => {
            if(selectedOps.length === 0){
                  alert('Select atleast one option');
                  return ;
            }

            const opsPayload = selectedOps.map((type) => ({type}));

            try{
                  const res = await api.post(`/clean/${datasetId}`,opsPayload);
                  alert(`Cleaning started!Job ID:${res.data.job_id}`);
                  setShowCleanModal(false);

                  setTimeout(() => window.location.reload(), 3000);
            }catch(err:any){
                  alert("Failed to start cleaning");
            }
      };

      useEffect(() => {
            const fetchPreviewData = async () => {
              try{
                const previewRes = await api.get(`/datasets/${datasetId}/preview`);
                setPreviewColumns(previewRes.data.columns || []);
              }catch(err: any){
                console.error(`Failed to fetch preview data:${err}`)
              }
            };

            if(datasetId){
              fetchPreviewData();
            }            
      }, [datasetId]);

      useEffect(() => {
            const fetchData = async () => {
                  try{
                        setLoading(true);
                        setError(null);

                        const dsRes = await api.get<DatasetDetail>(`/datasets/${datasetId}`);
                        setDataset(dsRes.data);

                        const previewRes = await api.get<PreviewData>(`/datasets/${datasetId}/preview`);
                        setPreview(previewRes.data);

                        const analysisRes = await api.get<{report : AnalysisReport}>(`/datasets/${datasetId}/analysis`);
                        setAnalysis(analysisRes.data.report);

                        const allJobsRes = await api.get(`/jobs?limit=50`);
                        const relatedJobs = allJobsRes.data.filter((j:any) => j.dataset_id === datasetId);
                        setJobs(relatedJobs);


                  }catch(err:any){
                        setError(err.response?.data?.detail || 'Failed to load datasets');
                        console.error(err);
                  }finally{
                        setLoading(false);
                        setJobsLoading(false);
                  }    
            };
            if(datasetId){
                  fetchData();
            }
      },[datasetId]);

      const handleQuickClean = async () => {
            if(!window.confirm("Start quick cleaning(remove duplicates + fill missing values with 0)?"))return ;

            try{
                  const res = await api.post(`/clean/${datasetId}`, [
                        {type:'remove_duplicates'},
                        {type:'fill_misssing', strategy:'constant', value:0, columns:null},
                  ]);
                  alert(`Cleaning job started.Job ID:${res.data.job_id}\nCheck job page for status`)
                  setTimeout(() => window.location.reload(), 3000);
            }catch(err: any){
                  alert(`Failed to start cleaning:` + (err.response?.data?.detail || 'Unknown  error'));
            }
      };

      if (loading){
            return <div className="p-8 text-cneter">Loading  dataset details...</div>;
      }

      if(error || !dataset){
            return (
                  <div className="p-8 text-center text-red-600">
                        {error || 'Dataset not found'}
                        <div className="mt-4">
                              <Link to="/datasets" className="text-blue-600 hover:underline">
                                    Back to Datasets
                              </Link>
                        </div>
                  </div>
            );
      }
      return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 truncate max-w-2xl">
            {dataset.filename}
          </h1>
          <div className="space-x-4">
            <Link
              to="/datasets"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Back to List
            </Link>
            <button
              onClick={handleQuickClean}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Quick Clean
            </button>
            <button
                onClick={() => setShowCleaningModal(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
                Clean Dataset (Advanced)
            </button>
            {/* <button
                  onClick={() => setShowCleanModal(true)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                  Clean Dataset (Advanced)
            </button> */}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Size</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">
                {dataset.file_size_byte != null ? `${(dataset.file_size_byte / 1024).toFixed(1)} KB` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Rows × Columns</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">
                {dataset.row_count ?? '?'} × {dataset.col_count ?? '?'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Uploaded</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">
                {new Date(dataset.uploaded_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Preview Table */}
        {preview && (
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Data Preview (first {preview.sample_rows.length} rows)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {preview.columns.map((col, idx) => (
                      <th
                        key={col}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {col}
                        <br />
                        <span className="text-gray-400 font-normal">({preview.dtypes[idx]})</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.sample_rows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {preview.columns.map((col) => (
                        <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row[col] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analysis Summary */}
        {analysis && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Analysis Report</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shape & Duplicates */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Overview</h3>
                <p>Rows: <strong>{analysis.shape.rows.toLocaleString()}</strong></p>
                <p>Columns: <strong>{analysis.shape.columns}</strong></p>
                <p className="mt-2">
                  Duplicates: <strong>{analysis.duplicates.count.toLocaleString()}</strong> 
                  ({analysis.duplicates.percentage}%)
                </p>
              </div>

              {/* Missing Values */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Missing Values</h3>
                {Object.keys(analysis.missing.counts).length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {Object.entries(analysis.missing.counts).map(([col, count]) => (
                      <li key={col}>
                        {col}: {count} ({analysis.missing.percentage[col]}%)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-green-600">No missing values</p>
                )}
              </div>
            </div>

            {/* Numeric Stats (simplified) */}
            {analysis.numeric_stats && Object.keys(analysis.numeric_stats).length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-medium mb-2">Numeric Columns Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analysis.numeric_stats).map(([col, stats]) => (
                    <div key={col} className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">{col}</p>
                      <p className="text-sm">Mean: {stats.mean?.toFixed(2) ?? '—'}</p>
                      <p className="text-sm">Min/Max: {stats.min ?? '—'} / {stats.max ?? '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Job History */}
                  
      <div className="mt-10 bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-medium text-gray-900">Processing History</h2>
      </div>

      {jobsLoading ? (
      <div className="p-6 text-center text-gray-500">Loading jobs...</div>
      ) : jobs.length === 0 ? (
      <div className="p-6 text-center text-gray-500">No processing jobs yet</div>
      ) : (
      <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started / Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                  </th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job) => (
                  <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {job.operation_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                  <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status as JobStatus)}`}
                  >
                        {getStatusLabel(job.status as JobStatus)}
                  </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {job.started_at ? new Date(job.started_at).toLocaleString() : '—'}<br />
                  {job.completed_at ? new Date(job.completed_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {job.status === 'completed' && job.result_path ? (
                        <a
                        href={`http://127.0.0.1:8000/api/v1/export/${job.id}`}
                        download
                        className="text-blue-600 hover:text-blue-900 underline"
                        >
                        Download
                        </a>
                  ) : (
                        '—'
                  )}
                  </td>
                  </tr>
            ))}
            </tbody>
            </table>
      </div>
      )}
      </div>
            <Modal
            isOpen={showCleanModal}
            onClose={() => setShowCleanModal(false)}
            title="Select Cleaning Operations"
            >
                  <div className="space-y-4">
                        <label className="flex items-center">
                              <input
                              type="checkbox"
                              checked={selectedOps.includes('remove_duplicates')}
                              onChange={(e) => {
                              if (e.target.checked) {
                                    setSelectedOps([...selectedOps, 'remove_duplicates']);
                              } else {
                                    setSelectedOps(selectedOps.filter((op) => op !== 'remove_duplicates'));
                              }
                              }}
                              className="mr-2"
                              />
                              Remove Duplicates
                        </label>

                        <label className="flex items-center">
                              <input
                              type="checkbox"
                              checked={selectedOps.includes('trim_strings')}
                              onChange={(e) => {
                                    if (e.target.checked) {
                                    setSelectedOps([...selectedOps, 'remove_duplicates']);
                              } else {
                                    setSelectedOps(selectedOps.filter((op) => op !== 'remove_duplicates'));
                              }
                              }}
                              className="mr-2"
                              />
                              Trim Whitespace (text columns)
                        </label>

                        <label className="flex items-center">
                              <input
                              type="checkbox"
                              checked={selectedOps.includes('convert_case')}
                              onChange={(e) => { if (e.target.checked) {
                                    setSelectedOps([...selectedOps, 'remove_duplicates']);
                              } else {
                                    setSelectedOps(selectedOps.filter((op) => op !== 'remove_duplicates'));
                              } }}
                              className="mr-2"
                              />
                              Convert to Title Case
                        </label>

                  {/* Add more checkboxes for other ops */}

                        <button
                              onClick={handleCleanSubmit}
                              className="mt-6 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full"
                        >
                              Start Cleaning
                        </button>
                  </div>
            </Modal>
            <CleaningModal
                isOpen={showCleaningModal}
                onClose={() => setShowCleaningModal(false)}
                datasetId={datasetId}
                availableColumns ={previewColumns}
                onJobStarted={(jobId) => {
                  console.log(`New Job started:${jobId}`)
                  // Optional: refresh jobs list after starting
                  setTimeout(() => {
                    // Re-fetch jobs here if needed
                    window.location.reload()
                  }, 3000);
                }}
              />
      </div>
    </div>
  );
}
