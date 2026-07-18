import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  User,
  Phone,
  Mail,
  Linkedin,
  Globe,
  MapPin,
  Building2,
  GraduationCap,
  Briefcase,
  Clock,
  Link as LinkIcon,
  UploadCloud,
  Send,
  Rocket,
  Info,
  CalendarDays,
  Github,
  FileText,
  ExternalLink,
  Award,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuthModal } from "../context/AuthModalContext";
import { supabase } from "../supabaseClient";

const postToGoogleForm = async (applicationData) => {
  const GOOGLE_FORM_URL = process.env.REACT_APP_GOOGLE_FORM_URL || "";
  
  if (!GOOGLE_FORM_URL) {
    console.log("ℹ️ Google Form URL is not configured. Skipping client-side form post.");
    return;
  }

  const fieldMapping = {
    how_heard_about_us: process.env.REACT_APP_GOOGLE_FORM_FIELD_HOW_HEARD || "entry.1753999706",
    full_name: process.env.REACT_APP_GOOGLE_FORM_FIELD_FULL_NAME || "entry.474493951",
    email: process.env.REACT_APP_GOOGLE_FORM_FIELD_EMAIL || "",
    phone_number: process.env.REACT_APP_GOOGLE_FORM_FIELD_PHONE || "entry.1422801395",
    apply_confirmation: process.env.REACT_APP_GOOGLE_FORM_FIELD_APPLY_CONFIRM || "entry.1548730422",
    linkedin_profile: process.env.REACT_APP_GOOGLE_FORM_FIELD_LINKEDIN || "entry.1922910232",
    country_state_city: process.env.REACT_APP_GOOGLE_FORM_FIELD_LOCATION || "entry.99296184",
    program_type: process.env.REACT_APP_GOOGLE_FORM_FIELD_PROGRAM_TYPE || "entry.2024330731",
    major_specialization: process.env.REACT_APP_GOOGLE_FORM_FIELD_MAJOR || "entry.1249420656",
    university: process.env.REACT_APP_GOOGLE_FORM_FIELD_UNIVERSITY || "entry.1166903644",
    graduation_year: process.env.REACT_APP_GOOGLE_FORM_FIELD_GRAD_YEAR || "entry.43991991",
    cv_url: process.env.REACT_APP_GOOGLE_FORM_FIELD_CV || "entry.1659602453",
    top_priority_role: process.env.REACT_APP_GOOGLE_FORM_FIELD_ROLE || "entry.695102901",
    role_rating: process.env.REACT_APP_GOOGLE_FORM_FIELD_ROLE_RATING || "entry.1802508767",
    skills_description: process.env.REACT_APP_GOOGLE_FORM_FIELD_SKILLS || "entry.1408066486",
    availability: process.env.REACT_APP_GOOGLE_FORM_FIELD_AVAILABILITY || "entry.2068642244",
    days_timings: process.env.REACT_APP_GOOGLE_FORM_FIELD_DAYS_TIMINGS || "entry.1874869137",
    native_state: process.env.REACT_APP_GOOGLE_FORM_FIELD_NATIVE_STATE || "entry.2136115182",
    is_student_status: process.env.REACT_APP_GOOGLE_FORM_FIELD_STUDENT_STATUS || "entry.459653991",
    highest_stipend: process.env.REACT_APP_GOOGLE_FORM_FIELD_STIPEND || "entry.197147332",
    experience_months: process.env.REACT_APP_GOOGLE_FORM_FIELD_EXPERIENCE || "entry.2145989347",
    portfolio_url: process.env.REACT_APP_GOOGLE_FORM_FIELD_PORTFOLIO || "entry.1322497166",
    available_to_join: process.env.REACT_APP_GOOGLE_FORM_FIELD_JOIN_DATE || "entry.1278536855",
    duration_stay: process.env.REACT_APP_GOOGLE_FORM_FIELD_DURATION || "entry.104853252",
    remarks: process.env.REACT_APP_GOOGLE_FORM_FIELD_REMARKS || "entry.2009630798",
  };

  const formData = new URLSearchParams();
  
  // Standard email collection parameter
  formData.append("emailAddress", String(applicationData.email || ""));
  for (const [key, entryId] of Object.entries(fieldMapping)) {
    if (entryId && applicationData[key] !== undefined && applicationData[key] !== null) {
      formData.append(entryId, String(applicationData[key]));
    }
  }

  try {
    await fetch(GOOGLE_FORM_URL, {
      method: "POST",
      mode: "no-cors", // Required to prevent CORS errors in browsers
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });
    console.log("✅ Application successfully submitted to Google Form.");
  } catch (error) {
    console.error("❌ Failed to submit to Google Form:", error);
  }
};

export default function ApplyInternship() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user, loadingUser } = useAuthModal();
  const navigate = useNavigate();

  const [hasApplied, setHasApplied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [internId, setInternId] = useState(null);
  const [existingCvUrl, setExistingCvUrl] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [fetchingExisting, setFetchingExisting] = useState(true);

  const callEdge = async (action, payload = {}) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error("No active session token");
    }

    const response = await fetch(
      `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/w_edge`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, ...payload }),
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result?.error) {
      throw new Error(result?.error || "Edge request failed");
    }

    return result;
  };

  const [form, setForm] = useState({
    how_heard_about_us: "",
    full_name: "",
    phone_number: "",
    email: "",
    apply_confirmation: "",
    linkedin_profile: "",
    country_state_city: "",
    program_type: "",
    major_specialization: "",
    university: "",
    graduation_year: "",
    cv: null,
    top_priority_role: "",
    role_rating: "",
    skills_description: "",
    availability: "",
    days_timings: "",
    native_state: "",
    is_student_status: "",
    highest_stipend: "",
    experience_months: "",
    portfolio_url: "",
    available_to_join: "",
    duration_stay: "",
    remarks: "",
  });

  useEffect(() => {
    if (!loadingUser && !user) navigate("/");
  }, [user, loadingUser]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const checkExistingApplication = async () => {
      const currentUserId = user?.id;
      if (!currentUserId) {
        setFetchingExisting(false);
        return;
      }
      try {
        const result = await callEdge("get_my_intern_application");
        const data = result.application;

        if (data) {
          setHasApplied(true);
          setInternId(data.id);
          setExistingCvUrl(data.cv_url);
          setCurrentStatus(data.current_status || "");
          setForm({
            how_heard_about_us: data.how_heard_about_us || "",
            full_name: data.full_name || "",
            phone_number: data.phone_number || "",
            email: data.email || "",
            apply_confirmation: data.apply_confirmation || "",
            linkedin_profile: data.linkedin_profile || "",
            country_state_city: data.country_state_city || 
              [data.city, data.state, data.country].filter(Boolean).join(", "),
            program_type: data.program_type || "",
            major_specialization: data.major_specialization || data.branch || "",
            university: data.university || "",
            graduation_year: data.graduation_year || "",
            cv: null,
            top_priority_role: data.top_priority_role || "",
            role_rating: data.role_rating || "",
            skills_description: data.skills_description || "",
            availability: data.availability || "",
            days_timings: data.days_timings || "",
            native_state: data.native_state || "",
            is_student_status: data.is_student_status || 
              (data.is_student ? "Yes" : data.is_working_professional ? "No. I am a Working Professional" : ""),
            highest_stipend: data.highest_stipend || "",
            experience_months: data.experience_months || "",
            portfolio_url: data.portfolio_url || "",
            available_to_join: data.available_to_join || "",
            duration_stay: data.duration_stay || "",
            remarks: data.remarks || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch application:", err);
      } finally {
        setFetchingExisting(false);
      }
    };

    if (!loadingUser) {
      checkExistingApplication();
    }
  }, [user, loadingUser]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setForm(prev => ({ ...prev, cv: files[0] }));
    } else {
      setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const handlePdfUpload = async (file, USERID) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("PDF must be less than 10MB");
      return;
    }

    try {
      setUploading(true);

      const filePath = `${USERID}/resume_${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("internship_resumes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("internship_resumes")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error(error);
      toast.error("PDF upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to apply");
      return;
    }

    if (!isEditing && !form.cv) {
      toast.error("Please upload your CV");
      return;
    }

    // Required fields validation
    if (!form.how_heard_about_us) {
      toast.error("Please specify how you heard about us");
      return;
    }
    if (!form.full_name.trim()) {
      toast.error("Full Name is required");
      return;
    }
    if (!form.phone_number.trim()) {
      toast.error("Phone Number is required");
      return;
    }
    if (!/^\d{10}$/.test(form.phone_number.replace(/\D/g, ""))) {
      toast.error("Enter a valid 10 digit phone number");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (!form.apply_confirmation) {
      toast.error("Please confirm your application agreement");
      return;
    }
    if (!form.linkedin_profile.trim()) {
      toast.error("LinkedIn Profile Link is required");
      return;
    }
    if (!form.linkedin_profile.startsWith("http")) {
      toast.error("LinkedIn URL must start with http:// or https://");
      return;
    }
    if (!form.country_state_city.trim()) {
      toast.error("Country, State, City is required");
      return;
    }
    if (!form.program_type) {
      toast.error("Please select Program Type");
      return;
    }
    if (!form.major_specialization) {
      toast.error("Please select or specify Major / Specialization");
      return;
    }
    if (!form.university.trim()) {
      toast.error("University / Institution is required");
      return;
    }
    if (!form.graduation_year || !/^\d{4}$/.test(form.graduation_year)) {
      toast.error("Graduation year must be 4 digits");
      return;
    }
    if (!form.top_priority_role) {
      toast.error("Please select a Top Priority Role");
      return;
    }
    if (!form.role_rating) {
      toast.error("Please rate yourself in the chosen role");
      return;
    }
    if (!form.skills_description.trim()) {
      toast.error("Please describe your skills");
      return;
    }
    if (!form.availability) {
      toast.error("Please select Availability");
      return;
    }
    if (!form.days_timings.trim()) {
      toast.error("Please specify your available Days & Timings");
      return;
    }
    if (!form.native_state.trim()) {
      toast.error("State (Native of) is required");
      return;
    }
    if (!form.is_student_status) {
      toast.error("Please specify if you are a student");
      return;
    }
    if (!form.available_to_join) {
      toast.error("Please specify when you are available to join");
      return;
    }
    if (!form.duration_stay) {
      toast.error("Please specify how long you plan to stay with us");
      return;
    }
    if (form.portfolio_url && !form.portfolio_url.startsWith("http")) {
      toast.error("Portfolio URL must start with http:// or https://");
      return;
    }

    setLoading(true);

    try {
      const cvUrl = form.cv
        ? await handlePdfUpload(form.cv, user.id)
        : existingCvUrl;

      if (!cvUrl) {
        setLoading(false);
        return;
      }

      const locParts = form.country_state_city.split(",").map(p => p.trim());

      const applicationData = {
        user_id: user.id,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
        linkedin_profile: form.linkedin_profile.trim(),
        portfolio_url: form.portfolio_url.trim(),
        github_url: form.github_url ? form.github_url.trim() : "",
        cv_url: cvUrl,

        university: form.university.trim(),
        graduation_year: form.graduation_year.trim(),
        program_type: form.program_type,
        top_priority_role: form.top_priority_role,
        availability: form.availability,
        available_to_join: form.available_to_join,

        // New fields
        how_heard_about_us: form.how_heard_about_us,
        apply_confirmation: form.apply_confirmation,
        role_rating: form.role_rating,
        skills_description: form.skills_description.trim(),
        native_state: form.native_state.trim(),
        highest_stipend: form.highest_stipend.trim(),
        experience_months: form.experience_months.trim(),
        duration_stay: form.duration_stay,
        remarks: form.remarks.trim(),
        days_timings: form.days_timings.trim(),
        major_specialization: form.major_specialization,

        // Derived legacy fields
        country: locParts[0] || "",
        state: locParts[1] || "",
        city: locParts[2] || "",
        branch: form.major_specialization,
        is_student: form.is_student_status === "Yes",
        is_working_professional: form.is_student_status === "No. I am a Working Professional",
        has_internship_exp: form.experience_months ? (parseInt(form.experience_months.replace(/\D/g, "")) > 0) : false,
        internship_exp_desc: form.experience_months ? `${form.experience_months} months` : "",
        work_experience_desc: form.is_student_status === "No. I am a Working Professional" ? form.skills_description.trim() : "",
        
        // Nullify other legacy fields
        start_week: "",
        end_week: "",
        start_time: null,
        end_time: null,
        interview_date: null
      };

      if (isEditing) {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/w_edge`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: "update_internship_application",
              id: internId,
              ...applicationData,
            }),
          }
        );

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        
        toast.success("Application updated successfully!");
        setIsEditing(false);
      } else {
        applicationData.current_status = "Applied";
        applicationData.current_sub_status = "Application Received";
        applicationData.created_at = new Date().toISOString();

        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/w_edge`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              action: "create_internship_application",
              ...applicationData,
            }),
          }
        );

        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        
        toast.success("Application submitted successfully!");
        
        // Automatically submit to Google Form (Client-side trigger)
        postToGoogleForm(applicationData);
        setHasApplied(true);
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Submission Error Details:", err);
      toast.error(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0A0F2C]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 md:px-16 bg-white dark:bg-[#0A0F2C] min-h-screen transition-colors duration-700 font-sans relative overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[140%] bg-[radial-gradient(circle_at_20%_30%,rgba(0,255,180,0.1)_0%,transparent_70%)] blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium shadow-md border border-emerald-100 dark:border-emerald-900/50 mb-6">
            <Rocket className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Join Our Team</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0D1B2A] dark:text-white leading-tight mb-6">
            Apply for <span className="bg-gradient-to-r from-[#00A884] via-[#00C6B1] to-[#00D4FF] text-transparent bg-clip-text">SmaranAI Internship</span>
          </h1>
        </div>

        <div className="bg-white dark:bg-[#0E1835]/90 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-8 md:p-10">
            {(hasApplied && !isEditing) && !submitted ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">You have already applied!</h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  {!["Selected", "Pre-boarding / Selected", "Pre-boarding Completed", "Onboarded", "Internship"].includes(currentStatus) ? (
                    <button onClick={() => { setSubmitted(false); setIsEditing(true); }} className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all">Edit Application</button>
                  ) : (
                    <span className="px-6 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-900/30 text-sm">⚠️ Editing is disabled as you have been selected.</span>
                  )}
                  <button onClick={() => navigate("/mypage")} className="px-8 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-[#111a2e] transition-colors">View Status in My Page</button>
                </div>
              </div>
            ) : !submitted || isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-gray-50 dark:bg-[#0E1835]/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6">
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-emerald-500" /> Application Alignment
                  </h3>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">Would you like to apply with us? <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { val: "Yes. this unpaid internship opportunity well aligns with my immediate requirements.", label: "Yes, this unpaid internship opportunity well aligns with my immediate requirements." },
                        { val: "No Thanks, I am looking for MNC/Corporate Internships", label: "No Thanks, I am looking for MNC/Corporate Internships" },
                        { val: "Volunteering unpaid", label: "Volunteering unpaid" }
                      ].map((item) => (
                        <label key={item.val} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${form.apply_confirmation === item.val ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300" : "border-gray-200 dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-[#111a2e] text-gray-700 dark:text-gray-300"}`}>
                          <input type="radio" name="apply_confirmation" value={item.val} checked={form.apply_confirmation === item.val} onChange={handleChange} className="mt-1 accent-emerald-500" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Select label="How did you hear about us?" name="how_heard_about_us" value={form.how_heard_about_us} onChange={handleChange} icon={Info} options={["Unstop", "Wellfound", "LinkedIn", "Whatsapp", "Instagram", "Google Search", "AI tools eg Chatgpt", "Other"]} />
                </div>

                <div>
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-500" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input name="full_name" value={form.full_name} onChange={handleChange} icon={User} label="Full Name" placeholder="John Doe" />
                    <Input name="email" value={form.email} onChange={handleChange} icon={Mail} label="Email Address" placeholder="you@example.com" type="email" />
                    <Input name="phone_number" value={form.phone_number} onChange={handleChange} icon={Phone} label="Phone Number" placeholder="9876543210 (10 digits)" />
                    <Input name="linkedin_profile" value={form.linkedin_profile} onChange={handleChange} icon={Linkedin} label="LinkedIn Profile Link" placeholder="https://linkedin.com/in/..." />
                    <Input name="native_state" value={form.native_state} onChange={handleChange} icon={MapPin} label="State (Native of)" placeholder="Kerala / Telangana..." />
                    <Input name="country_state_city" value={form.country_state_city} onChange={handleChange} icon={Globe} label="Country, State, City (Current Location)" placeholder="India, Telangana, Hyderabad" />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-500" /> Education & Skills
                  </h3>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">Are you currently enrolled in college / university studies? <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { val: "Yes", label: "Yes, I am a Student" },
                        { val: "No. I am Fresher, graduated, not working", label: "No, Fresher / Graduated" },
                        { val: "No. I am a Working Professional", label: "No, Working Professional" }
                      ].map((item) => (
                        <label key={item.val} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${form.is_student_status === item.val ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300" : "border-gray-200 dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-[#111a2e] text-gray-700 dark:text-gray-300"}`}>
                          <input type="radio" name="is_student_status" value={item.val} checked={form.is_student_status === item.val} onChange={handleChange} className="accent-emerald-500" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Select label="Program Type" name="program_type" value={form.program_type} onChange={handleChange} icon={GraduationCap} options={["Master's", "4‑Year Degree", "3‑Year Degree", "3‑Year Diploma", "PhD"]} />
                    <Select label="Major / Specialization" name="major_specialization" value={form.major_specialization} onChange={handleChange} icon={Building2} options={["AI / Data Science", "Computer Science / IT", "Business", "Creative Works", "Psychology", "Education (BEd, MEd)", "Sanskrit", "Other"]} />
                    <Input name="graduation_year" value={form.graduation_year} onChange={handleChange} icon={Clock} label="Graduation Year" placeholder="e.g. 2026" />
                  </div>
                  <Input name="university" value={form.university} onChange={handleChange} icon={Building2} label="University / Institution" placeholder="Institute Name..." />
                  <TextArea name="skills_description" value={form.skills_description} onChange={handleChange} label="Tell us about your skills" placeholder="Provide a 2-3 sentences summary of your relevant technical and soft skills..." icon={FileText} />
                </div>

                <div>
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-500" /> Priority Role & Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Select label="Your top priority ROLE" name="top_priority_role" value={form.top_priority_role} onChange={handleChange} icon={Briefcase} options={["AI Assisted Content Creator", "AI Developer", "Full Stack", "Front End", "UI/UX Figma", "Technical Advisor / Sol Architect", "S/W Requirement / Business Analyst", "Team Coordinator (FS/AI)", "Scripting / Automation", "S/W Developer", "Network & Simulations", "Course Trainer / Mentor", "Psychology", "Digital Marketing", "HR/Admin / Coordination / Secretary / PRO/Legal", "S/W Tester", "Ethical Hacking", "Cyber Security", "Sanskrit", "Education", "Creative Works", "Other"]} />
                    <Select label="Rate yourself in this role (out of 10)" name="role_rating" value={form.role_rating} onChange={handleChange} icon={Award} options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]} />
                  </div>
                  <div className="bg-emerald-50/20 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 mb-6 space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">Availability (Weekly Hours) <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { val: "Full Time (40hrs)", label: "Full Time (40hrs)" },
                          { val: "Full Time (30hrs)", label: "Full Time (30hrs)" },
                          { val: "Part Time (15hrs)", label: "Part Time (15hrs)" }
                        ].map((item) => (
                          <label key={item.val} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${form.availability === item.val ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300" : "border-gray-200 dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-[#111a2e] text-gray-700 dark:text-gray-300"}`}>
                            <input type="radio" name="availability" value={item.val} checked={form.availability === item.val} onChange={handleChange} className="accent-emerald-500" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input name="days_timings" value={form.days_timings} onChange={handleChange} icon={Clock} label="Days & Timings available" placeholder="e.g. Mon-Fri, 9:00 AM - 5:00 PM" />
                      <Input type="date" label="Earliest date you can join" name="available_to_join" value={form.available_to_join} onChange={handleChange} icon={CalendarDays} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">How long do you plan to stay with us? <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { val: "2 months", label: "2 months" },
                          { val: "3 months", label: "3 months (outstanding eligible for stipend)" },
                          { val: "Long Time", label: "Long Time" }
                        ].map((item) => (
                          <label key={item.val} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${form.duration_stay === item.val ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300" : "border-gray-200 dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-[#111a2e] text-gray-700 dark:text-gray-300"}`}>
                            <input type="radio" name="duration_stay" value={item.val} checked={form.duration_stay === item.val} onChange={handleChange} className="accent-emerald-500" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" /> Experience & Portfolio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Input name="experience_months" value={form.experience_months} onChange={handleChange} icon={Clock} label="Internship / Professional Experience (months)" placeholder="e.g. 6 (leave blank if none)" optional />
                    <Input name="highest_stipend" value={form.highest_stipend} onChange={handleChange} icon={Award} label="Highest stipend received" placeholder="e.g. 5000 / month (leave blank if none)" optional />
                  </div>
                  <div className="grid grid-cols-1 gap-6 mb-6">
                    <Input name="portfolio_url" value={form.portfolio_url} onChange={handleChange} icon={LinkIcon} label="Portfolio / Personal Website" placeholder="https://yourportfolio.com" optional />
                    <TextArea name="remarks" value={form.remarks} onChange={handleChange} label="Remarks / Comments" placeholder="Any queries / suggestions for us?" icon={Info} optional />
                  </div>
                </div>

                <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-[#0A0F2C] hover:bg-gray-100 dark:hover:bg-[#111a2e] transition-colors">
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-2 w-full h-full">
                    <UploadCloud className="w-10 h-10 text-emerald-500" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {isEditing && existingCvUrl ? "Update CV (PDF Only) - Optional" : "Upload CV (PDF Only)"} {!isEditing && <span className="text-red-500">*</span>}
                    </span>
                    <input type="file" accept="application/pdf" onChange={handleChange} className="hidden" />
                  </label>
                  {form.cv ? (
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 py-2 px-4 rounded-lg"><CheckCircle2 className="w-4 h-4" /> {form.cv.name}</div>
                  ) : isEditing && existingCvUrl ? (
                    <div className="mt-3 flex flex-col items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="font-medium">Using previously uploaded CV</span>
                      <a href={existingCvUrl} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-600 flex items-center gap-1">View Current CV <ExternalLink className="w-3 h-3" /></a>
                    </div>
                  ) : null}
                </div>

                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-emerald-500/25 transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 text-lg">
                  {loading ? "Processing..." : isEditing ? "Update Application" : "Apply Now"}
                </button>
              </form>
            ) : (
              <div className="text-center py-24 animate-fade-in">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {isEditing ? "Application Updated!" : "Application Submitted!"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                  {isEditing ? "Your application details have been successfully updated." : "Thank you for applying. We will review your profile and get back to you shortly."}
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="px-8 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Return Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------- */
/* REUSABLE UI COMPONENTS (Design System)      */
/* ------------------------------------------- */

const Input = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  icon: Icon,
  placeholder,
  optional = false,
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
      {label} {!optional && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl 
          border border-gray-300 dark:border-gray-700 
          bg-white dark:bg-[#0A0F2C] 
          text-gray-900 dark:text-white placeholder-gray-400
          focus:ring-2 focus:ring-emerald-400 focus:border-transparent 
          outline-none transition-all duration-200
        `}
      />
    </div>
  </div>
);

// --- NEW TEXTAREA COMPONENT ---
const TextArea = ({
  label,
  name,
  value,
  onChange,
  icon: Icon,
  placeholder,
  optional = false,
}) => (
  <div className="flex flex-col gap-2 animate-fade-in-up">
    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
      {label} {!optional && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      {Icon && (
        <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
        </div>
      )}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows="3"
        className={`
          w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl 
          border border-gray-300 dark:border-gray-700 
          bg-white dark:bg-[#0A0F2C] 
          text-gray-900 dark:text-white placeholder-gray-400
          focus:ring-2 focus:ring-emerald-400 focus:border-transparent 
          outline-none transition-all duration-200 resize-none
        `}
      />
    </div>
  </div>
);

const Select = ({ label, name, value, onChange, options, icon: Icon }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
      {label} <span className="text-red-500">*</span>
    </label>
    <div className="relative group">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
        </div>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`
          w-full ${Icon ? "pl-10" : "pl-4"} pr-10 py-3 rounded-xl 
          border border-gray-300 dark:border-gray-700 
          bg-white dark:bg-[#0A0F2C] 
          text-gray-900 dark:text-white
          focus:ring-2 focus:ring-emerald-400 focus:border-transparent 
          outline-none transition-all appearance-none cursor-pointer
        `}
      >
        <option value="" className="text-gray-400">
          Select...
        </option>
        {options.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  </div>
);

const Checkbox = ({ name, checked, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
    <div className="relative flex items-center">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 dark:border-gray-600 checked:bg-emerald-500 checked:border-emerald-500 transition-all"
      />
      <CheckCircle2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
    </div>
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
      {label}
    </span>
  </label>
);
