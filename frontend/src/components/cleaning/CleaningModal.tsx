import { useState } from "react";
import Modal from "../common/Modal";
import api from "../../services/api";


interface CleaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: number;
  availableColumns: string[];
  onJobStarted: (jobId: number) => void;
}

export default function CleaningModal({
  isOpen,
  onClose,
  datasetId,
  availableColumns,
  onJobStarted,
}: CleaningModalProps) {
  const [selectedOps, setSelectedOps] = useState<string[]>([]);
  const [opConfigs, setOpConfigs] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const availableOperations = [
    { id: "remove_duplicates", label: "Remove Duplicates", configurable: false },
    { id: "fill_missing", label: "Fill Missing Values", configurable: true },
    { id: "trim_strings", label: "Trim Whitespace (text columns)", configurable: false },
    { id: "convert_case", label: "Convert Text Case", configurable: true },
    { id: "drop_columns", label: "Drop Columns", configurable: true },
    { id: "rename_column", label: "Rename Column", configurable: true },
    { id: "replace_value", label: "Replace Specific Values", configurable: true },
  ];

  const toggleOp = (opId: string) => {
    setSelectedOps((prev) =>
      prev.includes(opId) ? prev.filter((id) => id !== opId) : [...prev, opId]
    );
    // Clear errors when toggling
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[opId];
      return newErrors;
    });
  };

  const updateConfig = (opId: string, field: string, value: any) => {
    setOpConfigs((prev) => ({
      ...prev,
      [opId]: { ...prev[opId], [field]: value },
    }));
    // Clear error when user fixes it
    if (formErrors[opId]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[opId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    for (const opType of selectedOps) {
      const cfg = opConfigs[opType] || {};

      if (opType === "fill_missing") {
        if (!cfg.strategy) errors[opType] = "Strategy is required";
        if (cfg.strategy === "constant" && cfg.value === undefined)
          errors[opType] = "Value is required for constant strategy";
      }

      if (opType === "rename_column") {
        if (!cfg.old_name) errors[opType] = "Old column name is required";
        if (!cfg.new_name) errors[opType] = "New column name is required";
      }

      if (opType === "replace_value") {
        if (cfg.old_value === undefined || cfg.old_value === "")
          errors[opType] = "Value to find is required";
        if (cfg.new_value === undefined || cfg.new_value === "")
          errors[opType] = "Replacement value is required";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast("Please fix the errors in the form", "error");
      return;
    }

    setSubmitting(true);

    const payload = selectedOps.map((type) => {
      const config = opConfigs[type] || {};
      return {
        type,
        ...config,
      };
    });

    try {
      const response = await api.post(`/clean/${datasetId}`, payload);
      const jobId = response.data.job_id;
      onJobStarted(jobId);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Unknown error";
      showToast("Failed to start cleaning: " + msg, "error");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Cleaning Operations">
      <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
        {/* Operation Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableOperations.map((op) => (
            <label
              key={op.id}
              className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedOps.includes(op.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedOps.includes(op.id)}
                onChange={() => toggleOp(op.id)}
                className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-900">{op.label}</span>
            </label>
          ))}
        </div>

        {/* Configuration Section */}
        {selectedOps.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-5">Configure Selected Operations</h3>

            {selectedOps.map((opType) => {
              const config = opConfigs[opType] || {};
              const error = formErrors[opType];

              return (
                <div key={opType} className="mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-4 capitalize border-b pb-2">
                    {opType.replace("_", " ")}
                  </h4>

                  {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

                  {/* fill_missing */}
                  {opType === "fill_missing" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Strategy <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={config.strategy || ""}
                          onChange={(e) => updateConfig(opType, "strategy", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select strategy...</option>
                          <option value="constant">Constant Value</option>
                          <option value="mean">Mean (numeric only)</option>
                          <option value="median">Median (numeric only)</option>
                          <option value="ffill">Forward Fill</option>
                          <option value="bfill">Backward Fill</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Columns (leave blank for all)
                        </label>
                        <select
                          multiple
                          value={config.columns || []}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                            updateConfig(opType, "columns", selected.length > 0 ? selected : undefined);
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md h-28"
                        >
                          {availableColumns.map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>
                      </div>

                      {(config.strategy === "constant" || !config.strategy) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fill Value <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={config.value ?? ""}
                            onChange={(e) => updateConfig(opType, "value", e.target.value)}
                            placeholder="0, unknown, N/A, etc."
                            className="w-full p-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* trim_strings - no config needed */}
                  {opType === "trim_strings" && (
                    <p className="text-sm text-gray-600">
                      Will trim whitespace from selected or all text columns.
                    </p>
                  )}

                  {/* convert_case */}
                  {opType === "convert_case" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Case Type
                      </label>
                      <select
                        value={config.case || "title"}
                        onChange={(e) => updateConfig(opType, "case", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="title">Title Case</option>
                        <option value="upper">UPPERCASE</option>
                        <option value="lower">lowercase</option>
                      </select>
                    </div>
                  )}

                  {/* drop_columns */}
                  {opType === "drop_columns" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Columns to Drop
                      </label>
                      <select
                        multiple
                        value={config.columns || []}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                          updateConfig(opType, "columns", selected.length > 0 ? selected : undefined);
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md h-32"
                      >
                        {availableColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* rename_column */}
                  {opType === "rename_column" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Old Column Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={config.old_name || ""}
                          onChange={(e) => updateConfig(opType, "old_name", e.target.value)}
                          placeholder="Current name"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Column Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={config.new_name || ""}
                          onChange={(e) => updateConfig(opType, "new_name", e.target.value)}
                          placeholder="New name"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  )}

                  {/* replace_value */}
                  {opType === "replace_value" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Columns
                        </label>
                        <select
                          multiple
                          value={config.columns || []}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                            updateConfig(opType, "columns", selected.length > 0 ? selected : undefined);
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md h-28"
                        >
                          {availableColumns.map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Value to Find <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={config.old_value ?? ""}
                          onChange={(e) => updateConfig(opType, "old_value", e.target.value)}
                          placeholder="e.g. 85, N/A, null"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Replace With <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={config.new_value ?? ""}
                          onChange={(e) => updateConfig(opType, "new_value", e.target.value)}
                          placeholder="e.g. 99, unknown"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || selectedOps.length === 0}
            className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors ${
              submitting || selectedOps.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {submitting ? "Starting Job..." : "Start Cleaning Job"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function showToast(arg0: string, arg1: string) {
  throw new Error("Function not implemented.");
}
