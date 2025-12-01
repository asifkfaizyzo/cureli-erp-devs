import { RotateCcw, Download, FileText, CheckCircle2, AlertCircle } from "lucide-react";

const DocumentCard = ({ doc, onApprove, onReject, onReset }) => {
  const getStatusStyles = () => {
    switch (doc.status) {
      case "approved": return "border-emerald-200 bg-emerald-50/40 ring-1 ring-emerald-100";
      case "failed": return "border-red-200 bg-red-50/40 ring-1 ring-red-100";
      default: return "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md";
    }
  };

  return (
    <div className={`relative rounded-lg border transition-all duration-300 flex flex-col justify-between group ${getStatusStyles()}`}>
      
      {/* TOP CONTENT */}
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg transition-colors ${doc.status === 'normal' ? 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600' : 'bg-white shadow-sm'}`}>
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-[12px] text-slate-800 truncate pr-2" title={doc.name}>{doc.name}</h4>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PDF</span>
            </div>
          </div>
          <a href={doc.pdfUrl} download className="text-slate-400 hover:text-[#0F172A] bg-transparent hover:bg-slate-100 p-1 rounded transition-all"><Download size={14} /></a>
        </div>
        
        <div className="bg-slate-50/80 rounded p-2 mt-2 border border-slate-100">
           <div className="flex justify-between text-[10px] mb-1"><span className="text-slate-500 font-medium">Date</span><span className="text-slate-700 font-semibold">{doc.date}</span></div>
           <div className="flex justify-between text-[10px]"><span className="text-slate-500 font-medium">Size</span><span className="text-slate-700 font-semibold">{doc.size}</span></div>
        </div>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="p-2.5 bg-white/50 border-t border-slate-100">
        {doc.status === "normal" && (
          <div className="flex gap-2">
            <button onClick={() => onApprove(doc.id)} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 py-1.5 rounded text-[11px] font-bold shadow-sm transition-all">Approve</button>
            <button onClick={() => onReject(doc.id)} className="flex-1 bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 py-1.5 rounded text-[11px] font-bold transition-all">Reject</button>
          </div>
        )}
        
        {doc.status === "approved" && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-emerald-700"><CheckCircle2 size={14} /><span className="text-[11px] font-bold">Verified</span></div>
            <button onClick={() => onReset(doc.id)} className="text-slate-400 hover:text-emerald-700 p-1 rounded transition-all"><RotateCcw size={12} /></button>
          </div>
        )}
        
        {doc.status === "failed" && (
          <div className="flex flex-col gap-1 px-1">
            <div className="flex items-center justify-between text-red-600">
               <div className="flex items-center gap-1.5"><AlertCircle size={14} /><span className="text-[11px] font-bold">Rejected</span></div>
               <button onClick={() => onReset(doc.id)} className="text-slate-400 hover:text-red-600 p-1 rounded transition-all"><RotateCcw size={12} /></button>
            </div>
            {doc.reason && <p className="text-[10px] text-red-500 pl-5 font-medium truncate">"{doc.reason}"</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;