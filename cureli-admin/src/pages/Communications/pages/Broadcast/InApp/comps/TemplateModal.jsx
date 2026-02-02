// src/pages/Communications/pages/Broadcast/InApp/comps/TemplateModal.jsx
import { useState, useEffect } from "react";
import { FileText, X, Plus, Trash2, Star } from "lucide-react";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";

function TemplateModal({ onSelect, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    title: "",
    message: "",
    priority: "normal",
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await broadcastAPI.getTemplates();
      if (res.data.success) {
        setTemplates(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      await broadcastAPI.useTemplate(template.template_id);
      onSelect(template);
    } catch (err) {
      console.error("Failed to use template:", err);
    }
  };

  const handleCreate = async () => {
    if (!newTemplate.name || !newTemplate.title || !newTemplate.message) return;
    
    try {
      await broadcastAPI.createTemplate(newTemplate);
      setShowCreate(false);
      setNewTemplate({ name: "", title: "", message: "", priority: "normal" });
      loadTemplates();
    } catch (err) {
      console.error("Failed to create template:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-white" />
            <h3 className="text-white text-lg font-semibold">Message Templates</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30"
            >
              <Plus size={14} />
              New Template
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {showCreate ? (
            <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900">Create New Template</h4>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(p => ({ ...p, name: e.target.value }))}
                placeholder="Template name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <input
                type="text"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate(p => ({ ...p, title: e.target.value }))}
                placeholder="Notification title"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <textarea
                value={newTemplate.message}
                onChange={(e) => setNewTemplate(p => ({ ...p, message: e.target.value }))}
                placeholder="Message content"
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Save Template
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-8 text-gray-500">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No templates yet</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700"
              >
                Create your first template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.template_id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    {template.usage_count > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Star size={10} />
                        {template.usage_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{template.title}</p>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3">{template.message}</p>
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TemplateModal;