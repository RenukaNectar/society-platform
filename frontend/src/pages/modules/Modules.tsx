import React, { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import {
  getAllModules,
  getWorkflowsByModule,
} from "../../lib/data/modules/api";
import { CheckCircle, XCircle, Send, Bell } from "lucide-react";

export const Modules = () => {
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingWorkflows, setLoadingWorkflows] = useState(false);

  /* ================= LOAD MODULES ================= */
  useEffect(() => {
    const loadModules = async () => {
      try {
        setLoadingModules(true);

        const res: any = await getAllModules({ active: true });
        const list = res?.data?.modules || [];

        setModules(list);

        if (list.length > 0) {
          setSelectedModule(list[0]);
          loadWorkflows(list[0].id);
        }
      } catch (e) {
        console.error("Failed loading modules", e);
      } finally {
        setLoadingModules(false);
      }
    };

    loadModules();
  }, []);

  /* ================= LOAD WORKFLOWS ================= */
  const loadWorkflows = async (moduleId: string) => {
    try {
      setLoadingWorkflows(true);

      const res: any = await getWorkflowsByModule(moduleId);
      const list = res?.data?.workflows || [];

      setWorkflows(list);
    } catch (e) {
      console.error("Failed loading workflows", e);
      setWorkflows([]);
    } finally {
      setLoadingWorkflows(false);
    }
  };

  /* ================= PARSE DOCUMENTS ================= */
  const parseDocuments = (docs: any) => {
    try {
      if (!docs) return [];

      if (typeof docs === "string") {
        const fixed = docs.replace(/(\w+):/g, '"$1":').replace(/'/g, '"');

        return JSON.parse(fixed);
      }

      return docs;
    } catch (err) {
      console.log("DOC PARSE ERROR:", docs);
      return [];
    }
  };

  /* ================= UI ================= */
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* LEFT PANEL */}
      <div className="col-span-3">
        <Card className="p-4 space-y-3 h-full">
          {loadingModules && (
            <p className="text-sm text-gray-500">Loading modules...</p>
          )}

          {!loadingModules && modules.length === 0 && (
            <p className="text-sm text-gray-500">No modules found</p>
          )}

          {!loadingModules &&
            modules.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedModule(m);
                  loadWorkflows(m.id);
                }}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedModule?.id === m.id
                    ? "bg-indigo-50 border-indigo-300 font-medium"
                    : "hover:bg-gray-50 border-transparent"
                }`}
              >
                {m.name}
              </button>
            ))}
        </Card>
      </div>

      {/* RIGHT PANEL */}
      <div className="col-span-9">
        {/* ✅ Made flex column + fixed height */}
        <Card className="p-6 h-[85vh] flex flex-col">
          <h2 className="font-semibold text-lg mb-5">
            {selectedModule
              ? `${selectedModule.name} Workflows`
              : "Select a Module"}
          </h2>

          {loadingWorkflows && (
            <p className="text-sm text-gray-500">Loading workflows...</p>
          )}

          {!loadingWorkflows && workflows.length === 0 && (
            <p className="text-sm text-gray-500">
              No workflows found for this module.
            </p>
          )}

          {/* ================= TIMELINE ================= */}
          {!loadingWorkflows && workflows.length > 0 && (
            /* ✅ Scroll added here */
            <div className="relative pl-12 flex-1 overflow-y-auto pr-4">
              {/* Vertical Line */}
              <div className="absolute left-5 top-0 bottom-0 w-[3px] bg-gradient-to-b from-indigo-500 to-gray-200"></div>

              {workflows.map((wf, index) => {
                const approveDocs = parseDocuments(wf?.approval_documents);
                console.log("aprrove: ", approveDocs);

                const rejectDocs = parseDocuments(wf?.reject_documents);

                return (
                  /* ✅ Gap reduced */
                  <div key={wf.id} className="relative ">
                    {/* STEP CIRCLE */}
                    <div className="absolute -left-2 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-lg border-4 border-white ">
                      {wf.sequence}
                    </div>

                    {/* STEP CARD */}
                    <div className="ml-16  bg-white rounded-2xl shadow-md hover:shadow-xl transition p-6 border">
                      {/* HEADER */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold">
                            <span className="px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-700 font-semibold capitalize">
                              {wf?.allowedRole?.name?.replaceAll("_", " ") ||
                                "—"}
                            </span>
                          </h3>

                          <div className="flex items-center gap-2 mt-2">
                            {wf.is_hq && (
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                                HQ
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            wf.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {wf.active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {/* APPROVE + REJECT GRID */}
                      <div
                        className={`grid gap-6 ${
                          wf?.rejectStatus ? "grid-cols-2" : "grid-cols-1"
                        }`}
                      >
                        {/* YOUR APPROVE & REJECT BOX CODE REMAINS EXACTLY SAME */}
                        {/* (Nothing removed below — your original logic continues here) */}

                        {/* APPROVE BOX */}
                        <div className="rounded-xl p-5 bg-gradient-to-br from-green-50 to-green-100 border border-green-300">
                          <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold">
                            <CheckCircle size={18} />{" "}
                            {wf?.assignedToRole?.name || "Approved"}{" "}
                          </div>

                          <div className="space-y-2 text-sm">
                            <p>
                              <span className="font-medium">Status:</span>{" "}
                              {wf?.approvalStatus?.title || "-"}
                            </p>

                            <p className="flex items-center gap-1">
                              <Send size={14} />
                              <span className="font-medium">Send To:</span>{" "}
                              {wf?.approval_send_to || "-"}
                            </p>

                            <p className="flex items-center gap-1">
                              <Bell size={14} />
                              <span className="font-medium">
                                Notification:
                              </span>{" "}
                              {wf?.approvalNotificationTemplate?.title || "-"}
                            </p>
                          </div>

                          {approveDocs.length > 0 && (
                            <div className="text-xs bg-white px-3 py-2 rounded border">
                              <span className="font-medium">
                                Documents:{" "}
                                {approveDocs
                                  .map((doc: any) =>
                                    typeof doc === "string"
                                      ? doc
                                      : `${doc.document || ""}${
                                          doc.input_type
                                            ? ` (Type: ${doc.input_type})`
                                            : ""
                                        }${doc.required ? " [Required]" : ""}`,
                                  )
                                  .join(", ")}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* REJECT BOX */}
                        {wf?.rejectStatus && (
                          <div className="rounded-xl p-5 bg-gradient-to-br from-red-50 to-red-100 border border-red-300">
                            <div className="flex items-center gap-2 mb-3 text-red-700 font-semibold">
                              <XCircle size={18} /> {wf?.rejectRole?.name}
                            </div>

                            <div className="space-y-2 text-sm">
                              <p>
                                <span className="font-medium">Status:</span>{" "}
                                {wf?.rejectStatus?.title || "-"}
                              </p>

                              <p className="flex items-center gap-1">
                                <Send size={14} />
                                <span className="font-medium">
                                  Send To:
                                </span>{" "}
                                {wf?.reject_send_to || "-"}
                              </p>

                              <p className="flex items-center gap-1">
                                <Bell size={14} />
                                <span className="font-medium">
                                  Notification:
                                </span>{" "}
                                {wf?.rejectNotificationTemplate?.title || "-"}
                              </p>
                            </div>

                            {rejectDocs.map((doc: any, i: number) => (
                              <div
                                key={i}
                                className="flex justify-between items-center text-xs bg-white px-3 py-2 rounded border mb-1"
                              >
                                <div className="flex flex-col">
                                  <span className="capitalize font-medium">
                                    {String(doc.document || "").replaceAll(
                                      "_",
                                      " ",
                                    )}
                                  </span>

                                  {doc.input_type && (
                                    <span className="text-[10px] text-gray-500">
                                      Type: {doc.input_type}
                                    </span>
                                  )}
                                </div>

                                {doc.required && (
                                  <span className="text-red-500 font-semibold text-[10px]">
                                    It is not Required
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ✅ Arrow spacing reduced */}
                    {index !== workflows.length - 1 && (
                      <div className="flex justify-center mt-2">
                        <div className="text-indigo-400 text-2xl animate-bounce">
                          ↓
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
