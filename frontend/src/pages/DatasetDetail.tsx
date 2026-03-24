import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { type JobStatus, getStatusColor, getStatusLabel } from "../types/job";
// import Modal from "../components/common/Modal";
import CleaningModal from "../components/cleaning/CleaningModal";
import Toast from "../components/common/Toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

interface DatasetDetail {
  id: number;
  filename: string;
  file_size_byte: number | null;
  uploaded_at: string;
  row_count: number | null;
  col_count: number | null;
}

interface PreviewData {
  columns: string[];
  dtypes: string[];
  sample_rows: Array<Record<string, any>>;
  total_rows?: number;
}

interface AnalysisReport {
  shape: { rows: number; columns: number };
  missing: { counts: Record<string, number>; percentage: Record<string, number> };
  duplicates: { count: number; percentage: number };
  numeric_stats?: Record<string, Record<string, any>>;
  categorial_top_values?: Record<
    string,
    { top_values: Record<string, number>; unique_count: number }
  >;
}

export default function DatasetDetail() {
  const { id } = useParams<{ id: string }>();
  const datasetId = Number(id);

  const [dataset, setDataset] = useState<DatasetDetail | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState<boolean>(true);
  const [showCleaningModal, setShowCleaningModal] = useState<boolean>(false);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);
  const [shouldPoll, setShouldPoll] = useState<boolean>(false);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  };

  // Fetch preview columns for modal
  useEffect(() => {
    if (datasetId) {
      api
        .get(`/datasets/${datasetId}/preview`)
        .then((res) => {
          setPreviewColumns(res.data.columns || []);
        })
        .catch((err) => {
          console.error("Failed to fetch preview columns:", err);
        });
    }
  }, [datasetId]);

  // Main data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const dsRes = await api.get<DatasetDetail>(`/datasets/${datasetId}`);
        setDataset(dsRes.data);

        const previewRes = await api.get<PreviewData>(`/datasets/${datasetId}/preview`);
        setPreview(previewRes.data);

        const analysisRes = await api.get<{ report: AnalysisReport }>(`/datasets/${datasetId}/analysis`);
        setAnalysis(analysisRes.data.report);

        const allJobsRes = await api.get(`/jobs?limit=50`);
        const relatedJobs = allJobsRes.data.filter((j: any) => j.dataset_id === datasetId);
        setJobs(relatedJobs);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load dataset details");
        console.error(err);
      } finally {
        setLoading(false);
        setJobsLoading(false);
      }
    };

    if (datasetId) {
      fetchData();
    }
  }, [datasetId]);

  // Polling logic
  useEffect(() => {
    let interval: number | null = null;

    if (shouldPoll) {
      interval = window.setInterval(async () => {
        try {
          const res = await api.get("/jobs?limit=50");
          const related = res.data.filter((j: any) => j.dataset_id === datasetId);
          setJobs(related);

          const stillActive = related.some((j: any) => j.status === "pending" || j.status === "running");
          if (!stillActive) {
            setShouldPoll(false);
            showToast("All jobs have finished processing", "success");
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 8000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [shouldPoll, datasetId]);

  // Auto-start polling if active jobs exist
  useEffect(() => {
    if (jobs.length > 0 && !shouldPoll) {
      const hasActive = jobs.some((j) => j.status === "pending" || j.status === "running");
      if (hasActive) setShouldPoll(true);
    }
  }, [jobs, shouldPoll]);

  const handleQuickClean = async () => {
    if (!window.confirm("Start quick cleaning (remove duplicates + fill missing with 0)?")) return;

    try {
      const res = await api.post(`/clean/${datasetId}`, [
        { type: "remove_duplicates" },
        { type: "fill_missing", strategy: "constant", value: 0 },
      ]);
      showToast(`Cleaning job started! Job ID: ${res.data.job_id}`, "success");
      setShouldPoll(true);
    } catch (err: any) {
      showToast(
        "Failed to start quick clean: " + (err.response?.data?.detail || "Unknown error"),
        "error"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-12 w-1/3 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white shadow rounded-lg p-6">
                  <div className="h-6 w-1/2 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 w-1/3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 text-center text-red-600">
        {error || "Dataset not found"}
        <div className="mt-6">
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
          <h1 className="text-3xl font-bold text-gray-900 truncate max-w-2xl">{dataset.filename}</h1>
          <div className="space-x-4">
            <Link
              to="/datasets"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
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
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white  shadow rounded-lg p-6 mb-8">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Size</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">
                {dataset.file_size_byte != null ? `${(dataset.file_size_byte / 1024).toFixed(1)} KB` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Rows × Columns</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">
                {dataset.row_count ?? "?"} × {dataset.col_count ?? "?"}
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
        {preview ? (
          <div className="bg-white   shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Data Preview (first {preview.sample_rows.length} rows)
              </h2>
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
                          {row[col] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 mb-8 animate-pulse">
            <div className="h-8 w-1/3 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        )}

        {/* Analysis with Charts */}
        {analysis ? (
          <div className="mt-10 bg-white  shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Insights</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Missing Values Bar Chart */}
              <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">Missing Values (%)</h3>
                {analysis?.missing?.percentage && Object.keys(analysis.missing.percentage).length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(analysis.missing.percentage)
                          .map(([col, pct]) => ({ column: col, missing_pct: pct }))
                          .sort((a, b) => b.missing_pct - a.missing_pct)
                          .slice(0, 10)}
                        margin={{ top: 10, right: 30, left: 20, bottom: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="column"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          interval={0}
                          fontSize={12}
                        />
                        <YAxis label={{ value: "Missing %", angle: -90, position: "insideLeft" }} />
                        <Tooltip formatter={(value) => [`${value}%`, "Missing"]} />
                        <Bar dataKey="missing_pct" fill="#ef4444" name="Missing %" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-12">No missing values detected</p>
                )}
              </div>

              {/* Categorical Top Values Pie Charts */}
              {analysis.categorial_top_values &&
                Object.entries(analysis.categorial_top_values).map(([col, info]: [string, any]) => {
                  const pieData = Object.entries(info.top_values || {}).map(([val, count], index) => ({
                    name: val || "(empty)",
                    value: count as number,
                    fill: COLORS[index % COLORS.length],
                  }));

                  if (pieData.length === 0) return null;

                  return (
                    <div key={col} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                      <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">
                        Top Values — {col} ({info.unique_count} unique)
                      </h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              innerRadius={40}
                              label={({ name, percent = 0 }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              labelLine={false}
                            />
                            <Tooltip formatter={(value, name) => [`${value} occurrences`, name]} />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}
            </div>

            {!analysis.categorial_top_values ||
              (Object.keys(analysis.categorial_top_values).length === 0 && (
                <p className="text-center text-gray-500 mt-8 py-6">
                  No categorical columns with top values detected
                </p>
              ))}
          </div>
        ) : (
          <div className="mt-10 bg-white shadow rounded-lg p-6 animate-pulse">
            <div className="h-8 w-1/4 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        )}

        {/* Job History */}
        <div className="mt-10 bg-white  shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Processing History</h2>
            <div className="text-sm text-gray-500 flex items-center gap-3">
              {shouldPoll && <span className="text-blue-600 animate-pulse">Auto-refreshing...</span>}
              <button
                onClick={() => {
                  api.get("/jobs?limit=50").then((res) => {
                    const related = res.data.filter((j: any) => j.dataset_id === dataset.id);
                    setJobs(related);
                  });
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Refresh Now
              </button>
            </div>
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
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            job.status as JobStatus
                          )}`}
                        >
                          {getStatusLabel(job.status as JobStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {job.started_at ? new Date(job.started_at).toLocaleString() : "—"}
                        <br />
                        {job.completed_at ? new Date(job.completed_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {job.status === "completed" && job.result_path ? (
                          <a
                            href={`http://127.0.0.1:8000/api/v1/export/${job.id}`}
                            download
                            className="text-blue-600 hover:text-blue-900 underline"
                          >
                            Download
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cleaning Modal */}
        <CleaningModal
          isOpen={showCleaningModal}
          onClose={() => setShowCleaningModal(false)}
          datasetId={datasetId}
          availableColumns={previewColumns}
          onJobStarted={(jobId) => {
            showToast(`Cleaning job started! Job ID: ${jobId}`, "success");
            setShouldPoll(true);
          }}
        />

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}