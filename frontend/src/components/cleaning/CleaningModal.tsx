import { useEffect, useState } from "react";
import Modal from "../common/Modal";
// import { type JobStatus } from "../../types/job";
import api from "../../services/api";

// interface CleaningOperations{
//       type:string;
//       columns?:string[];
//       strategy?:string;
//       value?:any;
//       old_name?:string;
//       new_name?:string;
//       case?:string;
//       old_value?:any;
//       new_value?:any;
// }

interface CleaningModalProps{
      isOpen:boolean;
      onClose:() => void;
      datasetId:number;
      availableColumns:string[];
      onJobStarted:(jobId:number) => void;
}

export default function CleaningModal({
      isOpen,
      onClose,
      datasetId,
      availableColumns,
      onJobStarted
}:CleaningModalProps) {
      const [selectedOps, setSelectedOps] = useState<string[]>([]);
      const [opConfigs, setOpConfigs] = useState<Record<string, any>>({});
      const [submitting, setSubmitting] = useState<boolean>(false);
      // const [availableColumns, setAvailableColumns] = useState<string[]>([]);

      

      const availableOperations = [
            {id:'remove_duplicates', label:'Remove Duplicates',configurable:false},
            {id:'fill_missing', label:"Fill Missing Values",configurable:false},
            {id:'trim_strings', label:'Trim Whitespace (text columns)',configurable:false},
            {id:'convert_case', label:'Convert Text Case',configurable:false},
            {id:'drop_columns', label:'Drop Columns',configurable:false},
            {id:'rename_column', label:'Rename Column',configurable:false},
            {id:'replace_value', label:'Replace Specific value',configurable:false},
      ];

      const toggleOp = (opId: string) => {
            setSelectedOps((prev) => 
                  prev.includes(opId)? prev.filter(id => id !== opId):[...prev,opId]
            );
      };

      const updateConfig = (opId:string, field:string, value:any ) => {
            setOpConfigs((prev) => ({
                  ...prev,
                  [opId]:{...prev[opId], [field]:value},
            }));
      };

      const handleSubmit = async () => {
            if(selectedOps.length === 0){
                  alert('Please select atleast one operation');
                  return ;
            }

            setSubmitting(true);

            const payload = selectedOps.map((type) => {
                  const config = opConfigs[type] || {};
                  return {
                        type,
                        ...config,
                  };
            } );

            try{
                  const response = await api.post(`/clean/${datasetId}`, payload);
                  const jobId = response.data.job_id;
                  alert(`Cleaning job started.Job ID:${jobId}`);
                  onJobStarted?.(jobId);
                  onClose();
                  
            }catch(err:any){
                  const msg =  err.response?.data?.detail || err.message || 'Unknown Error';
                  alert('Failed to start the job:' + msg);
                  console.error(err);
            }finally{
                  setSubmitting(false);
            }
      };
     return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Cleaning Operations">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Operation selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableOperations.map(op => (
            <label
              key={op.id}
              className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedOps.includes(op.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedOps.includes(op.id)}
                onChange={() => toggleOp(op.id)}
                className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-900">
                {op.label}
              </span>
            </label>
          ))}
        </div>

        {/* Configuration forms for selected operations */}
        {selectedOps.length > 0 && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Configure Selected Operations
            </h3>

            {selectedOps.map(opType => {
              const config = opConfigs[opType] || {};

              return (
                <div key={opType} className="mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-4 capitalize">
                    {opType.replace('_', ' ')}
                  </h4>

                  {/* fill_missing */}
                  {opType === 'fill_missing' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Strategy
                        </label>
                        <select
                          value={config.strategy || 'constant'}
                          onChange={e => updateConfig(opType, 'strategy', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="constant">Constant Value</option>
                          <option value="mean">Mean (numeric only)</option>
                          <option value="median">Median (numeric only)</option>
                          <option value="ffill">Forward Fill</option>
                          <option value="bfill">Backward Fill</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Columns (comma separated, blank = all)
                        </label>
                        <input
                          type="text"
                          value={config.columns?.join(', ') || ''}
                          onChange={e => {
                            const cols = e.target.value
                              ? e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                              : undefined;
                            updateConfig(opType, 'columns', cols);
                          }}
                          placeholder="e.g. price, quantity, Stock_Qty"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      {(config.strategy === 'constant' || !config.strategy) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fill Value
                          </label>
                          <input
                            type="text"
                            value={config.value ?? ''}
                            onChange={e => updateConfig(opType, 'value', e.target.value)}
                            placeholder="0, unknown, N/A, etc."
                            className="w-full p-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* trim_strings */}
                  {opType === 'trim_strings' && (
                    <div>
                      <p className="text-sm text-gray-600">
                        Will trim whitespace from all text columns (no extra configuration needed)
                      </p>
                    </div>
                  )}

                  {/* convert_case */}
                  {opType === 'convert_case' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Case Type
                      </label>
                      <select
                        value={config.case || 'title'}
                        onChange={e => updateConfig(opType, 'case', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="title">Title Case (First Letter Capital)</option>
                        <option value="upper">UPPERCASE</option>
                        <option value="lower">lowercase</option>
                      </select>
                    </div>
                  )}

                  {/* drop_columns */}
                  {opType === 'drop_columns' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Columns to Drop (comma separated)
                      </label>
                      <input
                        type="text"
                        value={config.columns?.join(', ') || ''}
                        onChange={e => {
                          const cols = e.target.value
                            ? e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                            : undefined;
                          updateConfig(opType, 'columns', cols);
                        }}
                        placeholder="e.g. notes, temp_column"
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}

                  {/* rename_column */}
                  {opType === 'rename_column' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Old Column Name
                        </label>
                        <input
                          type="text"
                          value={config.old_name || ''}
                          onChange={e => updateConfig(opType, 'old_name', e.target.value)}
                          placeholder="ItemName"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Column Name
                        </label>
                        <input
                          type="text"
                          value={config.new_name || ''}
                          onChange={e => updateConfig(opType, 'new_name', e.target.value)}
                          placeholder="item_name"
                          className="w-full p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  )}

                  {/* replace_value */}
                  {opType === 'replace_value' && (
                        <div className="space-y-4">
                        {/* Column selector - dropdown from preview */}
                        <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                              Columns to Replace In
                              </label>
                              <select
                              multiple
                              value={config.columns || []}
                              onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                              updateConfig(opType, 'columns', selected.length > 0 ? selected : undefined);
                              }}
                              className="w-full p-2 border border-gray-300 rounded-md h-28 focus:ring-blue-500 focus:border-blue-500"
                              >
                              {availableColumns.length > 0 ? (
                              availableColumns.map((col) => (
                                    <option key={col} value={col}>
                                    {col}
                                    </option>
                              ))
                              ) : (
                              <option disabled>No columns loaded</option>
                              )}
                              </select>
                              <p className="mt-1 text-xs text-gray-500">
                              Hold Ctrl/Cmd to select multiple. Leave empty for all columns.
                              </p>
                        </div>

                        {/* Value to Find */}
                        <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                              Value to Find
                              </label>
                              <input
                              type="text"  // Keep text for flexibility — we convert on backend
                              value={config.old_value ?? ''}
                              onChange={(e) => updateConfig(opType, 'old_value', e.target.value)}
                              placeholder="e.g. 85, N/A, empty string, null"
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                              For numeric columns, type the number exactly (e.g. 85 or 85.0)
                              </p>
                        </div>

                        {/* Replace With */}
                        <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                              Replace With
                              </label>
                              <input
                              type="text"
                              value={config.new_value ?? ''}
                              onChange={(e) => updateConfig(opType, 'new_value', e.target.value)}
                              placeholder="e.g. 99, unknown, blank, 0"
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              />
                        </div>

                        {/* Optional: hint for numeric columns */}
                        {config.columns?.length > 0 && config.columns.some((col:string) => 
                              ['Math', 'Science', 'English', 'History', 'unit_price', 'Stock_Qty'].includes(col) // customize for your common numeric columns
                        ) && (
                              <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                              Selected columns appear numeric — use numeric values (e.g. 85 or 85.0) for best match.
                              </p>
                        )}
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
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {submitting ? 'Starting Job...' : 'Start Cleaning Job'}
          </button>
        </div>
      </div>
    </Modal>
  );

}

