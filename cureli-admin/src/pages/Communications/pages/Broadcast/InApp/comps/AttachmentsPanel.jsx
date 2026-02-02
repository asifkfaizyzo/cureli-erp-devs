// src/pages/Communications/pages/Broadcast/InApp/comps/AttachmentsPanel.jsx
import { useState } from "react";
import { Link2, Image, Video, X, Plus, ExternalLink } from "lucide-react";
import StyledSelect from "../../../../../../components/common/StyledSelect";

const ATTACHMENT_TYPES = [
  { value: "link", label: "🔗 Link", icon: Link2 },
  { value: "image", label: "🖼️ Image URL", icon: Image },
  { value: "video", label: "🎬 Video URL", icon: Video },
];

function AttachmentsPanel({ attachments = [], onChange, disabled }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState("link");
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const handleAdd = () => {
    if (!newUrl.trim()) return;

    const newAttachment = {
      type: newType,
      url: newUrl.trim(),
      label: newLabel.trim() || null,
    };

    onChange([...attachments, newAttachment]);
    setNewUrl("");
    setNewLabel("");
    setIsAdding(false);
  };

  const handleRemove = (index) => {
    onChange(attachments.filter((_, i) => i !== index));
  };

  const getTypeIcon = (type) => {
    const config = ATTACHMENT_TYPES.find(t => t.value === type);
    const Icon = config?.icon || Link2;
    return <Icon size={14} />;
  };

  const getTypeColor = (type) => {
    const colors = {
      link: "bg-blue-100 text-blue-700 border-blue-200",
      image: "bg-green-100 text-green-700 border-green-200",
      video: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colors[type] || colors.link;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
          <Link2 size={12} />
          Attachments
          <span className="text-gray-400">({attachments.length}/5)</span>
        </label>
        {attachments.length < 5 && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            disabled={disabled}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Plus size={12} />
            Add
          </button>
        )}
      </div>

      {/* Existing Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, index) => (
            <div
              key={index}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs ${getTypeColor(att.type)}`}
            >
              {getTypeIcon(att.type)}
              <span className="max-w-[120px] truncate">
                {att.label || new URL(att.url).hostname}
              </span>
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-60 hover:opacity-100"
              >
                <ExternalLink size={10} />
              </a>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="opacity-60 hover:opacity-100"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Attachment */}
      {isAdding && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <StyledSelect
              value={newType}
              onChange={setNewType}
              options={ATTACHMENT_TYPES}
              placeholder="Type"
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (optional)"
              className="col-span-2 px-2 py-2 text-sm border border-gray-200 rounded-lg"
            />
          </div>
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder={
              newType === "image" 
                ? "https://example.com/image.jpg" 
                : newType === "video"
                  ? "https://youtube.com/watch?v=..."
                  : "https://example.com"
            }
            className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newUrl.trim()}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Add Attachment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttachmentsPanel;