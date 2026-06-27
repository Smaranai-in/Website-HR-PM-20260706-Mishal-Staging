import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { FaLinkedin, FaGithub, FaGlobe } from "react-icons/fa";
import {
    Briefcase,
    Clock,
    GraduationCap,
    Loader2,
    FileText,
    MessageSquare,
    History,
    Award,
    TrendingDown,
    Shield,
    Brain,
    AlertTriangle,
    Target,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { useAuthModal } from "../context/AuthModalContext";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAssessment } from "../context/AssessmentContext";

export default function MyPage() {
    const { user, profile, loadingUser } = useAuthModal();
    const { studentAssessment, fetchStudentAssessment, getRemainingTime } = useAssessment();
    const [loading, setLoading] = useState(true);
    const [internData, setInternData] = useState(null);
    const [interviewData, setInterviewData] = useState(null);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");
    const [activeTask, setActiveTask] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Track last fetched userId + whether auth was previously loading
    const fetchedForUserId = useRef(null);
    const wasLoadingUser = useRef(true);

    const fetchDashboardDetails = async (forceUserId) => {
        const currentUserId = forceUserId || user?.id || profile?.id;
        if (!currentUserId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        console.log("🔄 MyPage: fetching for userId:", currentUserId);
        try {
            // Fetch internship app + interview + active task in PARALLEL
            const [
                { data: interviewRes, error: interviewError },
                { data: internRes, error: internError },
                { data: activeTaskRes, error: activeTaskError }
            ] = await Promise.all([
                supabase
                    .from("interviews")
                    .select("id, status, score, feedback, is_suspicious, tab_switch_count, created_at, video_url")
                    .eq("user_id", currentUserId)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle(),
                supabase
                    .from("w_internship_applications")
                    .select("id, user_id, full_name, university, program_type, branch, graduation_year, top_priority_role, availability, available_to_join, start_time, end_time, phone_number, linkedin_profile, github_url, portfolio_url, cv_url, work_experience_desc, current_status, status_history, review, reviewtimestamp, created_at")
                    .eq("user_id", currentUserId)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle(),
                supabase
                    .from("w_intern_projects")
                    .select("id, project_name, assigned_task, priority, status, progress, due_date")
                    .eq("intern_id", currentUserId)
                    .neq("status", "Completed")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle()
            ]);

            // Handle active task
            if (activeTaskError) {
                console.warn("⚠️ Active task fetch error:", activeTaskError.message);
                setActiveTask(null);
            } else {
                setActiveTask(activeTaskRes || null);
            }

            // Handle interview result
            if (interviewError) {
                console.warn("⚠️ Interview fetch error:", interviewError.message);
            }
            setInterviewData(interviewRes || null);

            // Handle internship result
            if (internError) {
                console.warn("⚠️ Internship fetch error:", internError.message);
                setInternData(null);
            } else if (internRes) {
                console.log("✅ Internship data found:", internRes.id);
                let parsedHistory = [];
                try {
                    if (typeof internRes.status_history === "string") {
                        parsedHistory = JSON.parse(internRes.status_history);
                    } else if (Array.isArray(internRes.status_history)) {
                        parsedHistory = internRes.status_history;
                    }
                } catch (e) {
                    console.warn("Failed to parse status_history", e);
                }
                internRes.status_history = parsedHistory;
                setInternData(internRes);
                // Fetch assessment (needs internship app id)
                fetchStudentAssessment(currentUserId, internRes.id).catch(err =>
                    console.warn("⚠️ Assessment fetch error:", err)
                );
            } else {
                console.log("ℹ️ No internship application found for userId:", currentUserId);
                setInternData(null);
            }

        } catch (error) {
            console.error("Error fetching Dashboard details:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // While auth is loading, mark that it was loading
        if (loadingUser) {
            wasLoadingUser.current = true;
            return;
        }

        const currentUserId = user?.id || profile?.id;

        if (!currentUserId) {
            setLoading(false);
            wasLoadingUser.current = false;
            return;
        }

        // Auth just settled (was loading, now not) → ALWAYS fetch fresh
        const authJustSettled = wasLoadingUser.current === true;
        wasLoadingUser.current = false;

        if (!authJustSettled && fetchedForUserId.current === currentUserId) return;
        fetchedForUserId.current = currentUserId;

        fetchDashboardDetails(currentUserId);
    }, [user?.id, profile?.id, loadingUser]);

    useEffect(() => {
        if (location.state?.refresh) {
            // Re-fetch data if navigating from assessment submission
            navigate("/mypage", { replace: true, state: {} });
        }
    }, [location.state, navigate]);

    useEffect(() => {
        if (studentAssessment?.due_date) {
            const interval = setInterval(() => {
                setTimeLeft(getRemainingTime(studentAssessment.due_date));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [studentAssessment?.due_date, getRemainingTime]);

    useEffect(() => {
        if (!loadingUser && !user) navigate("/");
    }, [user, loadingUser, navigate]);

    if (loadingUser) return null; // auth not ready — render nothing briefly

    const isInternSelected = internData && [
        "Selected",
        "Pre-boarding / Selected",
        "Pre-boarding Completed",
        "Onboarded",
        "Internship",
        "Week 1 Review",
        "Week 2 Review",
        "On Track",
        "Performance Issue",
        "Recommended for Offer",
        "Completed"
    ].includes(internData.current_status);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020c1b] pt-24 pb-16 transition-colors duration-300 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                
                {/* ================= CURRENT ACTIVE TASK SECTION ================= */}
                {activeTask && (
                    <div className="max-w-5xl mx-auto mb-10">
                        <div className="bg-gradient-to-br from-indigo-900/95 to-[#112240] dark:from-[#0a192f]/95 dark:to-[#112240]/95 rounded-2xl shadow-xl border border-indigo-500/20 overflow-hidden text-white p-8 relative">
                            {/* Accent Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full"></div>
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Current Active Task</span>
                                        <h2 className="text-xl font-bold">{activeTask.project_name}</h2>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    activeTask.priority === "High" ? "bg-red-500/20 text-red-300 border border-red-500/30" : 
                                    activeTask.priority === "Medium" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : 
                                    "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                }`}>
                                    {activeTask.priority} Priority
                                </span>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Task Details</h4>
                                    <p className="text-slate-200 text-sm leading-relaxed">{activeTask.assigned_task}</p>
                                </div>
                                
                                <div className="grid sm:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                                    <div>
                                        <span className="text-xs text-slate-400 block mb-1">Status</span>
                                        <span className="text-sm font-semibold text-indigo-300">{activeTask.status}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-400 block mb-1">Progress</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                                                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${activeTask.progress}%` }}></div>
                                            </div>
                                            <span className="text-sm font-bold">{activeTask.progress}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-400 block mb-1">Due Date</span>
                                        <span className="text-sm font-semibold text-slate-200">
                                            {activeTask.due_date ? new Date(activeTask.due_date).toLocaleDateString() : "No deadline"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            {loading && (
                <div className="max-w-5xl mx-auto space-y-4 mb-10">
                    {[1,2].map(i => (
                        <div key={i} className="bg-white dark:bg-[#112240] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 animate-pulse">
                            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
                            <div className="grid grid-cols-3 gap-6">
                                {[1,2,3].map(j => <div key={j} className="h-4 bg-slate-100 dark:bg-slate-800 rounded" />)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

                {/* ===== ACTIVE ASSESSMENT SECTION ===== */}
                {internData && (
                    <div className="max-w-5xl mx-auto mb-10">
                        {studentAssessment && studentAssessment.assessment_outlines ? (
                            <div className="bg-white dark:bg-[#112240] rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 overflow-hidden">
                                <div className="p-6 bg-emerald-500/10 border-b border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                        <Clock className="text-emerald-500 w-5 h-5" /> Active Assessment
                                    </h2>
                                    {studentAssessment.status !== "submitted" && (
                                        <div
                                            className={`px-4 py-1.5 rounded-full font-bold text-sm ${timeLeft === "Expired"
                                                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                }`}
                                        >
                                            {timeLeft}
                                        </div>
                                    )}
                                </div>

                                <div className="p-8">
                                    <div className="mb-6">
                                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
                                            {studentAssessment.assessment_outlines.domain}
                                        </span>
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                                            {studentAssessment.assessment_outlines.title}
                                        </h3>
                                        <div className="mt-4 p-4 bg-slate-50 dark:bg-[#0a192f] rounded-xl border-l-4 border-emerald-500">
                                            <div 
                                                className="text-slate-600 dark:text-slate-300 leading-relaxed italic text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none"
                                                dangerouslySetInnerHTML={{ __html: studentAssessment.assessment_outlines.description }}
                                            />
                                        </div>
                                    </div>

                                    {studentAssessment.status === "submitted" ? (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl flex items-center gap-4 border border-blue-100 dark:border-blue-900/30">
                                            <CheckCircle2 className="text-blue-500 w-10 h-10" />
                                            <div className="flex-1">
                                                <h4 className="font-bold text-blue-900 dark:text-blue-300 text-lg">
                                                    Assessment Submitted
                                                </h4>
                                                <p className="text-blue-700 dark:text-blue-200 text-sm">
                                                    Review Pending.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => navigate(`/assessment/${internData?.id}`)}
                                                className="px-6 py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-xl font-bold transition-all flex items-center gap-2 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                                            >
                                                <AlertCircle size={16} className="animate-pulse" />
                                                Upload Pending <ExternalLink size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Applied but hasn't selected assessment yet
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 flex items-start gap-4">
                                <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-blue-900 dark:text-blue-300">
                                        No Active Assessment
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                                        Go to the assessment page to choose your task.
                                    </p>
                                    <button
                                        onClick={() => navigate(`/assessment/${internData?.id}`)}
                                        className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Select Assessment &rarr;
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ================= INTERNSHIP APPLICATION DETAILS ================= */}
                <div className="max-w-5xl mx-auto">
                    {internData ? (
                        <div className="bg-white dark:bg-[#112240] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Briefcase className="w-6 h-6 text-emerald-500" />
                                    SmaranAI Internship Details
                                </h2>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(internData.current_status || "Applied")}`}>
                                    {internData.current_status || "Applied"}
                                </span>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Academic Info */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <GraduationCap size={14} /> Education & Personal
                                    </h3>
                                    <Detail label="Full Name" value={internData.full_name} />
                                    <Detail label="University" value={internData.university} />
                                    <Detail label="Degree & Branch" value={`${internData.program_type} - ${internData.branch}`} />
                                    <Detail label="Graduation Year" value={internData.graduation_year} />
                                </div>

                                {/* Role & Availability */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock size={14} /> Role & Availability
                                    </h3>
                                    <Detail label="Priority Role" value={internData.top_priority_role} />
                                    <Detail label="Availability" value={internData.availability} />
                                    <Detail label="Ready to Join" value={internData.available_to_join} />
                                    <Detail label="Working Hours" value={`${internData.start_time} - ${internData.end_time}`} />
                                </div>

                                {/* Contact & Professional Links */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14} /> Contact & Links
                                    </h3>
                                    <Detail label="Phone" value={internData.phone_number} />
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        {internData.linkedin_profile && (
                                            <a href={internData.linkedin_profile} target="_blank" className="p-2 bg-slate-100 dark:bg-[#0a192f] rounded-lg text-blue-600 hover:scale-110 transition-transform">
                                                <FaLinkedin size={20} />
                                            </a>
                                        )}
                                        {internData.github_url && (
                                            <a href={internData.github_url} target="_blank" className="p-2 bg-slate-100 dark:bg-[#0a192f] rounded-lg text-slate-800 dark:text-white hover:scale-110 transition-transform">
                                                <FaGithub size={20} />
                                            </a>
                                        )}
                                        {internData.portfolio_url && (
                                            <a href={internData.portfolio_url} target="_blank" className="p-2 bg-slate-100 dark:bg-[#0a192f] rounded-lg text-emerald-600 hover:scale-110 transition-transform">
                                                <FaGlobe size={20} />
                                            </a>
                                        )}
                                    </div>
                                    {internData.cv_url && (
                                        <a
                                            href={internData.cv_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-600/20"
                                        >
                                            <FileText size={16} /> View Resume
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Experience Description Footer */}
                            {internData.work_experience_desc && (
                                <div className="px-8 pb-8 pt-4">
                                    <div className="bg-slate-50 dark:bg-[#0a192f] p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Work/Internship Description</p>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed italic">
                                            "{internData.work_experience_desc}"
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Admin Updates & Remarks Section */}
                            {((internData.status_history?.length > 0) || internData.review?.length > 0 || internData.reviewtimestamp?.length > 0) && (
                                <div className="border-t border-slate-100 dark:border-slate-800 p-8 bg-slate-50/50 dark:bg-[#0a192f]/50">
                                    <button
                                        onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                                        className="w-full flex items-center justify-between group"
                                    >
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2 group-hover:text-emerald-500 transition-colors">
                                            <History className="w-4 h-4 text-emerald-500" />
                                            Application Timeline & Remarks
                                        </h3>
                                        <div className="p-2 bg-white dark:bg-[#112240] rounded-full border border-slate-200 dark:border-slate-700 shadow-sm group-hover:bg-slate-50 dark:group-hover:bg-[#0a192f] transition-colors">
                                            {isTimelineOpen ? (
                                                <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                            )}
                                        </div>
                                    </button>

                                    {isTimelineOpen && (
                                        <div className="space-y-4 mt-6 animate-in fade-in slide-in-from-top-4 duration-300 ease-out">
                                            {/* 1. New JSONB History Array (Prioritized) */}
                                            {internData.status_history && Array.isArray(internData.status_history) && internData.status_history.length > 0 ? (
                                                internData.status_history.map((historyItem, index) => (
                                                    <div key={`history-${index}`} className="bg-white dark:bg-[#112240] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden pl-4">
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${historyItem.status === 'Rejected' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

                                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                                    {historyItem.status === 'Applied' ? (
                                                                        <Briefcase className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                                                    ) : (
                                                                        <MessageSquare className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                                    )}
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest">
                                                                    {historyItem.status}
                                                                </span>
                                                            </div>

                                                            {historyItem.date && (
                                                                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md whitespace-nowrap">
                                                                    <Clock className="w-3 h-3" />
                                                                    {formatDateTime(historyItem.date)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {historyItem.remark && (
                                                            <div className="pl-8">
                                                                <p className="text-slate-600 dark:text-slate-300 text-sm italic">
                                                                    "{historyItem.remark}"
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <>
                                                    {/* 2. Fallback: Old Arrays of reviews */}
                                                    {Array.isArray(internData.review) && internData.review.map((rev, index) => {
                                                        const tsArray = internData.reviewtimestamp;
                                                        const timestamp = Array.isArray(tsArray) ? tsArray[index] : null;

                                                        return (
                                                            <div key={`legacy-arr-${index}`} className="bg-white dark:bg-[#112240] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden pl-4">
                                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>

                                                                <div className="flex justify-between items-start gap-4 mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                                            <MessageSquare className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                                        </div>
                                                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Admin Update</span>
                                                                    </div>

                                                                    {timestamp && (
                                                                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                                                                            <Clock className="w-3 h-3" />
                                                                            {formatDateTime(timestamp)}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <p className="text-slate-700 dark:text-slate-300 text-sm pl-8 italic">
                                                                    "{rev}"
                                                                </p>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* 3. Fallback: Old single string reviews */}
                                                    {typeof internData.review === "string" && internData.review.trim() !== "" && !Array.isArray(internData.review) && (
                                                        <div className="bg-white dark:bg-[#112240] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden pl-4">
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                                    <MessageSquare className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Admin Remark</span>
                                                            </div>
                                                            <p className="text-slate-700 dark:text-slate-300 text-sm pl-8 italic">
                                                                "{internData.review}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#112240] p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-8 h-8 text-slate-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                Internship Application
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-lg mb-6">
                                No internship application found for your account.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => {
                                        fetchedForUserId.current = null;
                                        fetchDashboardDetails(user?.id || profile?.id);
                                    }}
                                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 justify-center"
                                >
                                    🔄 Refresh Data
                                </button>
                                <button
                                    onClick={() => navigate('/internship')}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 justify-center"
                                >
                                    <Briefcase className="w-4 h-4" /> Apply for Internship
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ================= AI INTERVIEW RESULTS SECTION ================= */}
                <div className="max-w-5xl mx-auto mt-10">
                    <div className="bg-white dark:bg-[#112240] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Brain className="w-6 h-6 text-purple-500" />
                                AI Interview
                            </h2>
                            {interviewData && (
                                <button
                                    onClick={() => navigate('/ai-interview')}
                                    disabled={isInternSelected}
                                    className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors shadow-lg ${
                                        isInternSelected
                                            ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed shadow-none'
                                            : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                                    }`}
                                >
                                    Take Another Interview
                                </button>
                            )}
                        </div>

                        {interviewData ? (
                            interviewData.status === 'completed' ? (
                                <div className="p-8">
                                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                                        {/* Performance Score */}
                                        <div className="bg-slate-50 dark:bg-[#0a192f] p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-6">
                                            <div className="relative w-24 h-24 flex-shrink-0">
                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="8" />
                                                    <circle
                                                        cx="50" cy="50" r="45" fill="none"
                                                        stroke={interviewData.score >= 80 ? '#10b981' : interviewData.score >= 60 ? '#3b82f6' : '#ef4444'}
                                                        strokeWidth="8" strokeLinecap="round"
                                                        strokeDasharray={`${(interviewData.score || 0) * 2.83} 283`}
                                                        className="transition-all duration-1000 ease-out"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-2xl font-bold text-slate-800 dark:text-white">{interviewData.score || 0}%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 tracking-tight">Overall Performance</h3>
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${(interviewData.score || 0) >= 60 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {(interviewData.score || 0) >= 60 ? <Award className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                                    {(interviewData.score || 0) >= 60 ? 'Passed' : 'Needs Work'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Proctoring Status */}
                                        <div className="bg-slate-50 dark:bg-[#0a192f] p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-6">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${interviewData.is_suspicious ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                                <Shield className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 tracking-tight">Proctoring Status</h3>
                                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                                                    Tab Switches Detected: <span className={interviewData.tab_switch_count > 3 ? 'text-red-500' : 'text-emerald-500'}>{interviewData.tab_switch_count || 0}</span>
                                                </p>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${interviewData.is_suspicious ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                                    {interviewData.is_suspicious ? 'Flagged / Suspicious' : 'Clean / Verified'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Feedback */}
                                    {interviewData.feedback && (
                                        <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/30 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500 rounded-l-2xl"></div>
                                            <h3 className="font-bold text-lg mb-4 text-purple-800 dark:text-purple-300 flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4" /> Comprehensive AI Feedback
                                            </h3>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pl-2 italic">
                                                "{interviewData.feedback}"
                                            </p>
                                        </div>
                                    )}

                                </div>
                            ) : (
                                <div className="p-12 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                                        <Clock className="w-7 h-7 text-blue-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Interview In Progress</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                                        You have an interview session currently started but not finished. Complete it to see your performance metrics here!
                                    </p>
                                    <button
                                        onClick={() => navigate('/ai-interview')}
                                        disabled={isInternSelected}
                                        className={`px-6 py-2.5 text-white font-medium rounded-xl transition-all shadow-lg ${
                                            isInternSelected
                                                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed shadow-none'
                                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                                        }`}
                                    >
                                        Resume Interview
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                                    <Brain className="w-7 h-7 text-purple-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Ready for an AI Interview?</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                                    Take our AI-powered interview to assess your skills and get valuable feedback.
                                </p>
                                <button
                                    onClick={() => navigate('/ai-interview')}
                                    disabled={isInternSelected}
                                    className={`px-6 py-2.5 text-white font-medium rounded-xl transition-all shadow-lg ${
                                        isInternSelected
                                            ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed shadow-none'
                                            : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                                    }`}
                                >
                                    Start Interview
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}


// Reusable Detail Component
const Detail = ({ label, value }) => (
    <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className="font-semibold text-slate-800 dark:text-white break-words">
            {value || (
                <span className="text-slate-400 font-normal italic">Not provided</span>
            )}
        </p>
    </div>
);

// ---------------- HELPER FUNCTIONS for Profile Display ----------------
const getStatusColor = (is_select) => {
    if (is_select === "Applied") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (is_select === "Under Review") return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";

    // Assessment Group
    if ([
        "Assessment Stage", "Task Assigned", "Task Submitted", "Task to be Selected", "Task Resubmitted"
    ].includes(is_select)) return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";

    if ([
        "Task Reviewed – Pass", "Selected", "Onboarded", "Completed", "Internship",
        "Week 1 Review", "Week 2 Review", "On Track", "Recommended for Offer"
    ].includes(is_select)) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";

    if ([
        "Task Overdue (Auto)", "Task Reviewed – Fail (Resubmission Allowed)", "Task Reviewed – Fail (Final)",
        "Resubmission Not Received (Auto)", "Rejected", "Performance Issue", "Interview Failed", "Interview No Show"
    ].includes(is_select)) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

    // Interview Group
    if (is_select === "Interview Stage" || [
        "Interview Scheduled", "Interview Rescheduled", "Interview On Hold"
    ].includes(is_select)) return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";

    if ([
        "Interview Passed", "Pre-boarding / Selected", "Rules Shared & Email Sent", "Rules Shared",
        "Selection Email Sent", "Pre-boarding Completed"
    ].includes(is_select)) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

    if (is_select === "On Hold") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    if (is_select === "Withdrawn" || is_select === "Inactive") return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";

    return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
};

const formatDateTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
};
