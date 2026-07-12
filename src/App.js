import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Routes, Route, Link } from "react-router-dom";
import "react-image-gallery/styles/css/image-gallery.css";
import About from "./About";
import Partners from "./Partners";
import Impact from "./Impact";
import Mainicon from "./our-partner/favicon.png";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster"; // plain Leaflet plugin — attaches L.markerClusterGroup, no React dependency
import ReactDOMServer from "react-dom/server";
import { useMediaQuery } from "react-responsive";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CountUp from "react-countup";
import {
  FaMapMarkerAlt,
  FaRecycle,
  FaChartBar,
  FaDownload,
  FaFilePdf,
  FaChevronDown,
} from "react-icons/fa";

import staticDataRaw from "./data_cleaned.json";

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Waste Weight Function
const getWasteWeight = (quantity) => {
  switch (quantity) {
    case "below_500_kg":
      return 3.5;
    case "some_100_kg":
      return 1;
    case "_500kg_1_tonne":
      return 7.5;
    case "above_1_tonne":
      return 10;
    default:
      return 0;
  }
};

// Waste Type Map
const wasteTypeToColumnMap = {
  "Organic & Wet": "Organic and Wet Waste",
  "Plastic Paper": "Plastic Paper Glass Waste",
  "Sanitary & Hazardous": "Sanitary and Hazardous Waste",
  "Battery & Bulb": "Battery and Bulb Waste",
  "Construction & Demolition": "Construction and Demolition Waste",
  Clothes: "Clothes Waste",
  Carcasses: "Carcasses Waste",
  Others: "Others",
};

// Calculate Pie Data
const calculateWasteTypeCounts = (data) => {
  const counts = {};
  Object.keys(wasteTypeToColumnMap).forEach((type) => (counts[type] = 0));

  data.forEach((row) => {
    Object.entries(wasteTypeToColumnMap).forEach(([type, column]) => {
      if (row[column] === 1) counts[type] += 1;
    });
  });

  return Object.keys(counts)
    .filter((key) => counts[key] > 0)
    .map((key) => ({ name: key, value: counts[key] }));
};

// Calculate Pie Data for single row
const calculatePieForRow = (row) => {
  return Object.entries(wasteTypeToColumnMap)
    .filter(([type, column]) => row[column] === 1)
    .map(([type]) => ({ name: type, value: 1 }));
};

// Custom Labels for Pie
const renderCustomizedLabel = (isSmallScreen) => (props) => {
  const {
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
    name,
    index,
  } = props;

  const RADIAN = Math.PI / 180;

  // Stagger alternating labels further out from the donut so two adjacent
  // slices (e.g. "Battery & Bulb" next to "Construction & Demolition") never
  // land on the same radius and overlap/mix into each other.
  const baseOffset = isSmallScreen ? 45 : 35;
  const staggerOffset = (index % 2 === 1) ? (isSmallScreen ? 22 : 20) : 0;
  const labelRadius = outerRadius + baseOffset + staggerOffset;

  const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
  const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

  const percentage = (percent * 100).toFixed(1);

  if (name.includes(" & ")) {
    const [prefix, suffix] = name.split(" & ");
    return (
      <text
        x={x}
        y={y}
        fill="#000"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={isSmallScreen ? 9 : 13}
      >
        <tspan x={x} dy="-0.6em">{prefix} &</tspan>
        <tspan x={x} dy="1.2em">{suffix} {percentage}%</tspan>
      </text>
    );
  } else {
    return (
      <text
        x={x}
        y={y}
        fill="#000"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={isSmallScreen ? 9 : 13}
      >
        {`${name} ${percentage}%`}
      </text>
    );
  }
};

// Compact Tooltip Content Component
const TooltipContent = ({ row }) => {
  const getValue = (...keys) => {
    for (const key of keys) {
      const v = row[key];
      if (v != null && v !== "" && String(v).trim().toLowerCase() !== "n_a") {
        return String(v).trim().replace(/\r|\n/g, " ");
      }
    }
    return "N/A";
  };

  return (
    <div style={{ lineHeight: "1.25", fontSize: "12px", margin: 0, padding: 0 }}>
      {/* GVP Information */}
      <strong style={{ display: "block", margin: 0, padding: 0 }}>GVP Information</strong>
      <div style={{ margin: 0, padding: 0 }}>Ward: {row["GVP Ward"] ?? "N/A"}</div>
      <div style={{ margin: 0, padding: 0 }}>Nearest Location: {getValue("Nearest Location", "Nearest_Landmark_nearby_GVP")}</div>
      <div style={{ margin: 0, padding: 0 }}>In What Setting is GVP Present: {categorizeLocation(getValue("In_what_setting_is_the_GVP_pre", "Kindly_specify_the_area", "Location Type"))}</div>

      {/* Waste Type */}
      <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Waste Type:</strong>
      <ul style={{ margin: 0, paddingLeft: "14px", listStyleType: "disc" }}>
        {row["Organic and Wet Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Organic and Wet Waste</li>}
        {row["Plastic Paper Glass Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Plastic Paper Glass Waste</li>}
        {row["Sanitary and Hazardous Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Sanitary and Hazardous Waste</li>}
        {row["Battery and Bulb Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Battery and Bulb Waste</li>}
        {row["Construction and Demolition Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Construction and Demolition Waste</li>}
        {row["Clothes Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Clothes Waste</li>}
        {row["Carcasses Waste"] === 1 && <li style={{ margin: 0, padding: 0 }}>Carcasses Waste</li>}
        {row["Others"] === 1 && <li style={{ margin: 0, padding: 0 }}>Others</li>}
        {!(
          row["Organic and Wet Waste"] === 1 ||
          row["Plastic Paper Glass Waste"] === 1 ||
          row["Sanitary and Hazardous Waste"] === 1 ||
          row["Battery and Bulb Waste"] === 1 ||
          row["Construction and Demolition Waste"] === 1 ||
          row["Clothes Waste"] === 1 ||
          row["Carcasses Waste"] === 1 ||
          row["Others"] === 1
        ) && <li style={{ margin: 0, padding: 0 }}>N/A</li>}
      </ul>

      {/* Information Shared by Citizens */}
      <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Information Shared by Citizens</strong>
      <div style={{ margin: 0, padding: 0 }}>Has The Civic Authority Conducted Any Awareness Session: {getValue("Civic Authority Conduct Any Session", "Have_the_civic_authorities_con")}</div>
      <div style={{ margin: 0, padding: 0 }}>Have Interviewees Complained to Authorities: {getValue("Have Interviewees Complained to Authority", "Have_you_complained_to_the_aut")}</div>
      <div style={{ margin: 0, padding: 0 }}>If Yes How Was Your Experience: {getValue("If Yes How Was Your Experience ", "If_yes_how_was_your_experienc")}</div>
      <div style={{ margin: 0, padding: 0 }}>How Often is Waste Spotted: {getValue("Notice Frequency", "How_frequently_do_you_notice_g")}</div>
      <div style={{ margin: 0, padding: 0 }}>Where Interviewee Disposes Their Waste: {getValue("Where Interviewee Dispose Their Waste", "Where_do_you_dispose_off_your_")}</div>

      {/* Who disposes The Waste */}
      <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Who disposes The Waste:</strong>
      <ul style={{ margin: 0, paddingLeft: "14px", listStyleType: "disc" }}>
        {row.dispose_households === 1 && <li style={{ margin: 0, padding: 0 }}>Households</li>}
        {row.dispose_vendors === 1 && <li style={{ margin: 0, padding: 0 }}>Vendors</li>}
        {row.dispose_people_outside === 1 && <li style={{ margin: 0, padding: 0 }}>People from Outside</li>}
        {row.dispose_passing_crowd === 1 && <li style={{ margin: 0, padding: 0 }}>Passing Crowd</li>}
        {row.dispose_others === 1 && <li style={{ margin: 0, padding: 0 }}>Others</li>}
        {!(
          row.dispose_households === 1 ||
          row.dispose_vendors === 1 ||
          row.dispose_people_outside === 1 ||
          row.dispose_passing_crowd === 1 ||
          row.dispose_others === 1
        ) && <li style={{ margin: 0, padding: 0 }}>N/A</li>}
      </ul>

      {/* Gender */}
      {(getValue("No of Women", "group_ya6xw95_row/group_ya6xw95_row_column") !== "N/A" ||
        getValue("No of Men", "group_ya6xw95_row/group_ya6xw95_row_column_1") !== "N/A") && (
        <div>
          <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Gender:</strong>
          <ul style={{ margin: 0, paddingLeft: "14px", listStyleType: "disc" }}>
            {getValue("No of Women", "group_ya6xw95_row/group_ya6xw95_row_column") !== "N/A" && (
              <li style={{ margin: 0, padding: 0 }}>Women: {getValue("No of Women", "group_ya6xw95_row/group_ya6xw95_row_column")}</li>
            )}
            {getValue("No of Men", "group_ya6xw95_row/group_ya6xw95_row_column_1") !== "N/A" && (
              <li style={{ margin: 0, padding: 0 }}>Men: {getValue("No of Men", "group_ya6xw95_row/group_ya6xw95_row_column_1")}</li>
            )}
          </ul>
        </div>
      )}

      {/* Reasons For Waste Accumulation */}
      <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Reasons For Waste Accumulation:</strong>
      <ul style={{ margin: 0, paddingLeft: "14px", listStyleType: "disc" }}>
        {row.reason_no_collection === 1 && <li style={{ margin: 0, padding: 0 }}>No Regular Collection Vehicle</li>}
        {row.reason_random_people === 1 && <li style={{ margin: 0, padding: 0 }}>Random People Throwing Garbage</li>}
        {row.reason_user_fee === 1 && <li style={{ margin: 0, padding: 0 }}>Due To User Fee</li>}
        {row.reason_vehicle_time === 1 && <li style={{ margin: 0, padding: 0 }}>Mismatch of Vehicle Time</li>}
        {row.reason_narrow_road === 1 && <li style={{ margin: 0, padding: 0 }}>Due to Narrow Road</li>}
        {row.reason_market_vendors === 1 && <li style={{ margin: 0, padding: 0 }}>Because of Market and Street Vendors</li>}
        {!(
          row.reason_no_collection === 1 ||
          row.reason_random_people === 1 ||
          row.reason_user_fee === 1 ||
          row.reason_vehicle_time === 1 ||
          row.reason_narrow_road === 1 ||
          row.reason_market_vendors === 1
        ) && <li style={{ margin: 0, padding: 0 }}>N/A</li>}
      </ul>

      {/* Does Waste Get Cleared Off */}
      <div style={{ marginTop: "6px", margin: 0, padding: 0 }}>Does Waste Get Cleared Off: {getValue("Does Waste Clear Off", "Does_waste_get_cleared_off_fro")}</div>
      {getValue("When Waste Cleared Off", "If_yes_when_does_the_waste_ge") !== "N/A" && (
        <div style={{ margin: 0, padding: 0 }}>When Waste Cleared Off: {getValue("When Waste Cleared Off", "If_yes_when_does_the_waste_ge")}</div>
      )}

      {/* Problems Faced */}
      <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Problems Faced:</strong>
      <ul style={{ margin: 0, paddingLeft: "14px", listStyleType: "disc" }}>
        {row.problem_bad_odour === 1 && <li style={{ margin: 0, padding: 0 }}>Bad Odour</li>}
        {row.problem_mosquitos === 1 && <li style={{ margin: 0, padding: 0 }}>Mosquitos</li>}
        {row.problem_stray_animals === 1 && <li style={{ margin: 0, padding: 0 }}>Stray Animals</li>}
        {row.problem_congestion === 1 && <li style={{ margin: 0, padding: 0 }}>Congestion</li>}
        {row.problem_other === 1 && <li style={{ margin: 0, padding: 0 }}>Other</li>}
        {!(
          row.problem_bad_odour === 1 ||
          row.problem_mosquitos === 1 ||
          row.problem_stray_animals === 1 ||
          row.problem_congestion === 1 ||
          row.problem_other === 1
        ) && <li style={{ margin: 0, padding: 0 }}>N/A</li>}
      </ul>

      {/* Solution Suggested by Interviewee */}
      <strong style={{ display: "block", marginTop: "6px", marginBottom: 0, padding: 0 }}>Solution Suggested by Interviewee:</strong>
      <ul style={{ margin: 0, paddingLeft: "14px", listStyleType: "disc" }}>
        {row.solution_bins_facilities === 1 && <li style={{ margin: 0, padding: 0 }}>Bins and Facilities</li>}
        {row.solution_technology_monitoring === 1 && <li style={{ margin: 0, padding: 0 }}>Technology-Enabled Monitoring</li>}
        {row.solution_strict_enforcement === 1 && <li style={{ margin: 0, padding: 0 }}>Strict Enforcement Measures </li>}
        {row.solution_public_awareness === 1 && <li style={{ margin: 0, padding: 0 }}>Public Awareness & Education </li>}
        {row.solution_sanitization_roster === 1 && <li style={{ margin: 0, padding: 0 }}>Sanitization Vehicle Roster</li>}
        {row.solution_regulatory_support === 1 && <li style={{ margin: 0, padding: 0 }}>Regulatory & Administrative Support</li>}
        {row.solution_efficient_collection === 1 && <li style={{ margin: 0, padding: 0 }}>Efficient Waste Collection System</li>}
        {row.solution_neutral === 1 && <li style={{ margin: 0, padding: 0 }}>Neutral Feedback</li>}
        {!(
          row.solution_bins_facilities === 1 ||
          row.solution_technology_monitoring === 1 ||
          row.solution_strict_enforcement === 1 ||
          row.solution_public_awareness === 1 ||
          row.solution_sanitization_roster === 1 ||
          row.solution_regulatory_support === 1 ||
          row.solution_efficient_collection === 1 ||
          row.solution_neutral === 1
        ) && <li style={{ margin: 0, padding: 0 }}>N/A</li>}
      </ul>
    </div>
  );
};

// DataTable Component
const DataTable = ({ data, onRowClick, selectedRowStart }) => {
  const tableData = [...data].sort((a, b) => {
    const wardA = a["GVP Ward"] ? Number(a["GVP Ward"]) : Infinity;
    const wardB = b["GVP Ward"] ? Number(b["GVP Ward"]) : Infinity;
    return wardA - wardB;
  });

  const rowColors = [
    "#F5F7FF",
    "#F0FDFA",
    "#FEFCE8",
    "#F0FDF4",
    "#EFF6FF",
    "#FAF5FF",
    "#F8FAFC",
    "#FDF4FF",
  ];

  if (tableData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg text-center mt-6">
        <p className="text-gray-500 italic">
          No Garbage Points found for the current filter.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 w-full h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FaMapMarkerAlt className="text-indigo-500" />
        Photos and Videos of Garbage Points
      </h2>
      <div className="overflow-y-auto max-h-[348px] rounded-xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200 table-fixed text-sm">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[52%]" />
            <col className="w-[30%]" />
          </colgroup>
          <thead className="bg-gradient-to-r from-indigo-50 to-cyan-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                GVP Ward
              </th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Nearest Location
              </th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Media
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.slice(0, 50).map((row, index) => {
              // CRITICAL: Use row.start to identify which row is selected.
              // Never use array index — tableData order can differ from filteredTableData.
              const rowStart = row.start;
              const isSelected = selectedRowStart !== null && selectedRowStart === rowStart;

              // Extract media URLs at render time directly from THIS ROW's _attachments.
              // Never share or cache attachment URLs across rows.
              let photoUrl = "";
              let videoUrl = "";
              if (Array.isArray(row._attachments) && row._attachments.length > 0) {
                const photoAtt = row._attachments.find(
                  a => a.mimetype === "image/jpeg" || a.mimetype === "image/heic" || a.mimetype === "image/png"
                );
                const videoAtt = row._attachments.find(a => a.mimetype === "video/mp4");
                if (photoAtt) photoUrl = photoAtt.download_url || "";
                if (videoAtt) videoUrl = videoAtt.download_url || "";
              }
              // Fallback to normalized fields (static Nagpur JSON) — already per-row strings
              if (!photoUrl) photoUrl = (row["Photo URL"] && row["Photo URL"] !== "N/A" ? row["Photo URL"] : "") || "";
              if (!videoUrl) videoUrl = (row["Video URL"] && row["Video URL"] !== "N/A" ? row["Video URL"] : "") || "";

              // Row key: prefer start (unique), fall back to _uuid, then index
              const rowKey = rowStart || row._uuid || row._id || `idx-${index}`;
              return (
                <tr
                  key={rowKey}
                  className="hover:bg-indigo-50 hover:scale-[1.01] transition-all duration-150 cursor-pointer align-top"
                  style={{
                    minHeight: "40px",
                    backgroundColor: isSelected
                      ? "#C7D2FE"
                      : rowColors[index % rowColors.length],
                  }}
                  onClick={() => onRowClick(rowStart)}
                >
                  <td className="px-2 sm:px-4 py-2 text-sm font-medium text-gray-900 break-words">
                    {row["GVP Ward"] || "N/A"}
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-sm text-gray-700 break-words">
                    {row["Nearest Location"] || "N/A"}
                  </td>
                  <td className="media-cell px-2 sm:px-4 py-2 text-sm text-gray-700">
                    {photoUrl && photoUrl.startsWith("http") ? (
                      <a
                        href={photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="media-btn photo"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📷 Photo
                      </a>
                    ) : null}
                    {videoUrl && videoUrl.startsWith("http") ? (
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="media-btn video"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🎥 Video
                      </a>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Colors for pie chart — richer, more premium palette
const COLORS = [
  "#6366F1", // indigo
  "#06B6D4", // cyan
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#10B981", // emerald
  "#64748B", // slate
];

// Ward-specific color names for map markers
const WARD_COLOR_MAP = {
  "12": "red",
  "13": "green",
  "14": "blue",
  "15": "orange",
};

// Colors for bar charts — matched to the palette above
const BAR_COLORS = [
  "#6366F1",
  "#06B6D4",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
];

// Shared premium tooltip styling used across every Recharts <Tooltip />
const TOOLTIP_CONTENT_STYLE = {
  background: "rgba(255,255,255,0.97)",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  boxShadow: "0 10px 30px rgba(15,23,42,0.15)",
  padding: "10px 14px",
  fontSize: "13px",
};
const TOOLTIP_LABEL_STYLE = { fontWeight: 700, color: "#1F2937", marginBottom: 4 };
const TOOLTIP_ITEM_STYLE = { color: "#374151", padding: 0 };
const TOOLTIP_CURSOR_STYLE = { fill: "rgba(99,102,241,0.06)" };

// Card size classes
const CARD_SIZE_CLASSES = "w-[250px] h-32";

// Custom label for BarCharts
const renderCustomBarLabel = ({ x, y, width, value, height }) => {
  const screenWidth = window.innerWidth;
  const fontSize = screenWidth < 640 ? 10 : 14;
  const offset = screenWidth < 640 ? 8 : 20;

  return (
    <text
      x={x + width + offset}
      y={y + height / 2}
      fill="#333"
      textAnchor="start"
      dominantBaseline="middle"
      style={{ fontSize, fontWeight: "bold" }}
    >
      {`${value.toFixed(1)}%`}
    </text>
  );
};

// Calculate Problems Data with Normalization
const calculateProblemsData = (data) => {
  const problemMap = {
    "Bad Odour": "problem_bad_odour",
    "Mosquitos": "problem_mosquitos",
    "Stray Animals": "problem_stray_animals",
    "Congestion": "problem_congestion",
    "Other": "problem_other",
  };

  const problemsCount = {};
  Object.keys(problemMap).forEach((display) => (problemsCount[display] = 0));

  data.forEach((row) => {
    Object.entries(problemMap).forEach(([display, key]) => {
      if (row[key] === 1) problemsCount[display] += 1;
    });
  });

  const totalCount = Object.values(problemsCount).reduce((sum, count) => sum + count, 0);
  return Object.entries(problemsCount)
    .map(([problem, count]) => ({
      name: problem,
      value: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
};

// Calculate Reasons Data with Normalization
const calculateReasonsData = (data) => {
  const reasonsCount = {
    "No Regular Collection Vehicle": 0,
    "Random People Throwing Garbage": 0,
    "Due To User Fee": 0,
    "Mismatch of Vehicle Time": 0,
    "Due to Narrow Road": 0,
    "Because of Market and Street Vendors": 0,
  };

  data.forEach((row) => {
    reasonsCount["No Regular Collection Vehicle"] += row.reason_no_collection || 0;
    reasonsCount["Random People Throwing Garbage"] += row.reason_random_people || 0;
    reasonsCount["Due To User Fee"] += row.reason_user_fee || 0;
    reasonsCount["Mismatch of Vehicle Time"] += row.reason_vehicle_time || 0;
    reasonsCount["Due to Narrow Road"] += row.reason_narrow_road || 0;
    reasonsCount["Because of Market and Street Vendors"] += row.reason_market_vendors || 0;
  });

  const totalCount = Object.values(reasonsCount).reduce((sum, count) => sum + count, 0);

  return Object.entries(reasonsCount)
    .map(([reason, count]) => ({
      name: reason,
      value: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
};

// Category Map for Who Dispose
const categoryMap = [
  {
    category: "Households",
    keywords: [
      "जवळ पास असलेले सोसायटी",
      "Banglow wale log aju baju ke",
      "House hol",
      "other",
      "Household",
      "near by peoples",
      "House holds",
      "Nearby Households",
      "जवळ पास लोकांनी टाकतात आणि बाहेरून येणारे पण",
      "Household",
      "Householdss",
      "Nearby household",
      "colony people",
      "Near by houshold",
      "Nearby Households",
      "Citizens",
      "Residental peoples",
    ],
  },
  {
    category: "Vendors",
    keywords: [
      "small stalls",
      "Market wale log kachra dalte hai",
      "Vendor",
      "Street Vendorss ",
      "Vendors and Households",
      "Vendorss",
      "Street Vendors",
      "Chai wale",
      "People and households & street vendors",
      "vendors like fish and vegetables sellers",
      " Small Stalls",
      " shop keeper",
      "Street Vendors",
      " Street vendor",
      "Vendorss",
      " street vendors",
      "Small stall",
      "Shops",
    ],
  },
  {
    category: "People from Outside",
    keywords: [
      "people from outside",
      "People From Outside",
      "outside people",
      "Outside people",
      "people from Outside",
      "People from Outside",
      "People from outside",
    ],
  },
  {
    category: "Passing Crowd",
    keywords: [
      "आजुबाजूला असलेले लोक आणि ऑटो मधून जाणारे लोक पण येते कचरा टाकतात",
      "कचरा गाडीवरून जाणारे व्यक्ती पण टाकतात आणि सोबत जवळपास राहणारे व्यक्ती पण टाकतात",
      "जवळ पास चे लोक आणि रस्त्यावरून जाणारे लोक",
      "पर्यटक आणि बाजूचे स्टॉल वाले कचरे टाकतात",
      "Tourist",
      "जवळ पास चे लोक और रस्त्यावरून जाणाऱ्या लोक",
      "गाडीवरून येणाऱ्या लोक कचरा फेकून जातात",
      "जाण्या येणाऱ्या गाड्या वरून लोक फेकतात",
      "बाहेरून येणाऱ्या लोक कचरा टाकुण जाते",
    ],
  },
  {
    category: "Others",
    keywords: [
      "माहित नाही",
      "लहुजी सावळे उद्यान अंबाझरी लेक",
      "Showroom",
      "N",
      "Unknownearby HouseHolds",
    ],
  },
];

function categorize(text) {
  if (!text || typeof text !== "string" || text.trim() === "" || text === "N/A") {
    return null;
  }
  const lowerText = text.toLowerCase().trim();
  for (const { category, keywords } of categoryMap) {
    if (keywords.some((k) => lowerText.includes(k.toLowerCase().trim()))) {
      return category;
    }
  }
  return "Others";
}

// Calculate Who Dispose Data with Categorization
const calculateWhoDisposeData = (data) => {
  const disposeCount = {
    Households: 0,
    Vendors: 0,
    "People from Outside": 0,
    "Passing Crowd": 0,
    Others: 0,
  };

  data.forEach((row) => {
    disposeCount["Households"] += row.dispose_households || 0;
    disposeCount["Vendors"] += row.dispose_vendors || 0;
    disposeCount["People from Outside"] += row.dispose_people_outside || 0;
    disposeCount["Passing Crowd"] += row.dispose_passing_crowd || 0;
    disposeCount["Others"] += row.dispose_others || 0;
  });

  const totalCount = Object.values(disposeCount).reduce((sum, count) => sum + count, 0);

  if (totalCount === 0) {
    return Object.keys(disposeCount).map((name) => ({ name, value: 0 }));
  }

  return Object.entries(disposeCount)
    .map(([name, count]) => ({
      name,
      value: (count / totalCount) * 100,
    }))
    .sort((a, b) => b.value - a.value);
};

// Calculate Location Data with Categorization
const locationMap = [
  {
    category: "Residential Area",
    keywords: ["residential", "colony", "house", "society"],
  },
  {
    category: "Nallah / Drain",
    keywords: ["nallah", "drain"],
  },
  {
    category: "Market / Commercial Area",
    keywords: ["market_place", "market", "bazaar", "shop"],
  },
  {
    category: "Playground / Open Space",
    keywords: ["playground", "ground", "sports", "field"],
  },
  {
    category: "School / Institution",
    keywords: ["school", "college", "institution"],
  },
  {
    category: "Open Plot / Vacant Land",
    keywords: ["open_plot", "vacant", "empty plot"],
  },
  {
    category: "Roadside / Footpath / Public Path",
    keywords: [
      "road",
      "roadside",
      "road side",
      "public path",
      "corner",
      "square",
      "front side",
      "temple",
      "collector office",
      "near sadar",
      "sem",
    ],
  },
  {
    category: "Water Body / Lake Area",
    keywords: ["lake", "water", "pond", "नदी", "लेक"],
  },
  {
    category: "Other / Miscellaneous",
    keywords: ["other", "unknown", "misc"],
  },
];

function categorizeLocation(text) {
  const lowerText = (text || "").toLowerCase().trim();
  for (const { category, keywords } of locationMap) {
    if (keywords.some((k) => lowerText.includes(k))) {
      return category;
    }
  }
  return "Other / Miscellaneous";
}

const calculateSettingData = (data) => {
  const settingCount = {
    "Residential Area": 0,
    "Nallah / Drain": 0,
    "Market / Commercial Area": 0,
    "Playground / Open Space": 0,
    "School / Institution": 0,
    "Open Plot / Vacant Land": 0,
    "Roadside / Footpath / Public Path": 0,
    "Water Body / Lake Area": 0,
    "Other / Miscellaneous": 0,
  };

  data.forEach((row) => {
    settingCount["Residential Area"] += row.setting_residential || 0;
    settingCount["Nallah / Drain"] += row.setting_nallah || 0;
    settingCount["Market / Commercial Area"] += row.setting_market || 0;
    settingCount["Playground / Open Space"] += row.setting_playground || 0;
    settingCount["School / Institution"] += row.setting_school || 0;
    settingCount["Open Plot / Vacant Land"] += row.setting_open_plot || 0;
    settingCount["Roadside / Footpath / Public Path"] += row.setting_roadside || 0;
    settingCount["Water Body / Lake Area"] += row.setting_water_body || 0;
    settingCount["Other / Miscellaneous"] += row.setting_other || 0;
  });

  const totalCount = Object.values(settingCount).reduce((sum, count) => sum + count, 0);

  return Object.entries(settingCount)
    .map(([name, count]) => ({
      name,
      value: totalCount > 0 ? (count / totalCount) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

// Solution Categories
const solutionCategories = [
  {
    category: "Bins and Facilities",
    keywords: [
      "Dust bin at Roadside",
      "Should Punishment Fee",
      "More Bins",
      "Bins",
      "More bins",
      "More Bins Awareness Among People",
      "Dustbins",
      "Add a board ",
      "Say to Use Of Dustbin",
      "Add Dustbin",
      " Bins Too",
      " Dustbins and Strictly Fine",
      "Bins and Facilities and strict fines",
      "Increasing of Dustbin",
    ],
  },
  {
    category: "Technology-Enabled Monitoring",
    keywords: [
      "Fine and Surveillance Camera at that Place",
      "Surveillance Camera at that Place",
      "install camera on street.",
      "Should Camera Surveillance",
    ],
  },
  {
    category: "Strict Enforcement Measures ",
    keywords: [
      "Strict Fines",
      "strictly fine for people",
      "Strictly Fine",
      "strict fines",
      "and strictly fine for people",
    ],
  },
  {
    category: "Public Awareness & Education ",
    keywords: [
      "Awareness Program",
      "Awareness Among People",
      "More Bins Awareness Among People",
    ],
  },
  {
    category: "Sanitization Vehicle Roster",
    keywords: ["Should Regular Visit of Cleaner Vans"],
  },
  {
    category: "Regulatory & Administrative Support",
    keywords: ["the NMC vehicle should collect this garbage from here ."],
  },
  {
    category: "Efficient Waste Collection System",
    keywords: [
      "Proper schedule for collection vehicle",
      "The Place Need to be get cleaned from the road side on daily basis.",
    ],
  },
  {
    category: "Neutral Feedback",
    keywords: ["Nothing"],
  },
];

function categorizeSolution(text) {
  const lowerText = (text || "").toLowerCase().trim();
  for (const { category, keywords } of solutionCategories) {
    if (keywords.some((k) => lowerText.includes(k.toLowerCase()))) {
      return category;
    }
  }
  return null;
}

// Calculate Solution Data with Categorization
const calculateSolutionData = (data) => {
  const solutionCount = {
    "Bins and Facilities": 0,
    "Technology-Enabled Monitoring": 0,
    "Strict Enforcement Measures ": 0,
    "Public Awareness & Education ": 0,
    "Sanitization Vehicle Roster": 0,
    "Regulatory & Administrative Support": 0,
    "Efficient Waste Collection System": 0,
    "Neutral Feedback": 0,
  };

  data.forEach((row) => {
    solutionCount["Bins and Facilities"] += row.solution_bins_facilities || 0;
    solutionCount["Technology-Enabled Monitoring"] += row.solution_technology_monitoring || 0;
    solutionCount["Strict Enforcement Measures "] += row.solution_strict_enforcement || 0;
    solutionCount["Public Awareness & Education "] += row.solution_public_awareness || 0;
    solutionCount["Sanitization Vehicle Roster"] += row.solution_sanitization_roster || 0;
    solutionCount["Regulatory & Administrative Support"] += row.solution_regulatory_support || 0;
    solutionCount["Efficient Waste Collection System"] += row.solution_efficient_collection || 0;
    solutionCount["Neutral Feedback"] += row.solution_neutral || 0;
  });

  const totalCount = Object.values(solutionCount).reduce((sum, count) => sum + count, 0);

  if (totalCount === 0) {
    return Object.keys(solutionCount).map((name) => ({ name, value: 0 }));
  }

  return Object.entries(solutionCount)
    .map(([name, count]) => ({
      name,
      value: (count / totalCount) * 100,
    }))
    .sort((a, b) => b.value - a.value);
};

const wasteReasonsMap = {
  "No Regular Collection Vehicle": ["no_regular_collection_vehicle"],
  "Random People Throwing Garbage": ["anti_social_behaviour__youngsters_throwi"],
  "Due To User Fee": ["due_to_user_fee"],
  "Mismatch of Vehicle Time": ["mis_match_of_vehicle_time__many_people_l"],
  "Due to Narrow Road": ["due_to_narrow_road__difficult_for_vehicl"],
  "Because of Market and Street Vendors": ["because_of_market___street_vendors"]
};

// Unified normalization function - ENHANCED FOR ALL ISSUES
const normalizeRow = (row) => {
  // CRITICAL: Start with a fresh shallow copy of only this row's own data.
  // Never share references with other rows.
  const norm = { ...row };

  // PRIMARY KEY: always carry row.start through normalization unchanged.
  // Every record must have a unique start timestamp.
  if (row.start !== undefined && row.start !== null) {
    norm.start = row.start;
  }

  // Ward - support both Nagpur and Pune ward fields
  const wardValue = row["GVP Ward"] || row["Select_the_ward"] || row["GVP_Ward"] || row.ward || row.ward_no || row.ward_number || row["Mention_ward_number_name_Pune"] || null;
  if (wardValue !== null) {
    norm["GVP Ward"] = Number(wardValue);
    norm.cluster_id = norm["GVP Ward"];
  }

  // ID
  const idValue = row.id || row.gvp_id || row._id || row.GVP_ID || null;
  if (idValue !== null) norm.id = idValue;
  // Preserve KoboToolbox UUID for strict deduplication
  if (row._uuid) norm._uuid = row._uuid;
  if (row["meta/instanceID"]) norm._uuid = norm._uuid || row["meta/instanceID"].replace("uuid:", "");

  // Location
  let lat = row["_Record_the_location_of_GVP_latitude"] || row.latitude || row.lat || null;
  let lng = row["_Record_the_location_of_GVP_longitude"] || row.longitude || row.lng || null;
  const locStr = row["Record_the_location_of_GVP"] || row.location || null;
  if ((!lat || !lng) && locStr) {
    const parts = String(locStr).trim().split(/\s+/);
    if (parts.length >= 2) {
      lat = parseFloat(parts[0]) || lat;
      lng = parseFloat(parts[1]) || lng;
    }
  }
  if (lat !== null) norm["_Record_the_location_of_GVP_latitude"] = Number(lat);
  if (lng !== null) norm["_Record_the_location_of_GVP_longitude"] = Number(lng);

  // Waste type normalization (0/1)
  const wasteMap = {
    "Organic_and_Wet_Waste": "Organic and Wet Waste",
    "Organic and Wet Waste": "Organic and Wet Waste",
    "Plastic_Paper_Glass_Waste": "Plastic Paper Glass Waste",
    "Plastic Paper Glass Waste": "Plastic Paper Glass Waste",
    "Sanitary_and_Hazardous_Waste": "Sanitary and Hazardous Waste",
    "Sanitary and Hazardous Waste": "Sanitary and Hazardous Waste",
    "Battery_and_Bulb_Waste": "Battery and Bulb Waste",
    "Battery and Bulb Waste": "Battery and Bulb Waste",
    "Construction_and_Demolition_Waste": "Construction and Demolition Waste",
    "Construction and Demolition Waste": "Construction and Demolition Waste",
    "Clothes Waste": "Clothes Waste",
    "Carcasses Waste": "Carcasses Waste",
    "Others": "Others",
  };
  Object.entries(wasteMap).forEach(([srcKey, targetKey]) => {
    if (row[srcKey] !== undefined) {
      let val = row[srcKey];
      if (val === "1_0" || val === "1" || val === 1 || val === true || String(val).trim() === "1") {
        val = 1;
      } else if (val === "0_0" || val === "0" || val === 0 || val === false || String(val).trim() === "0") {
        val = 0;
      } else {
        val = 0;
      }
      norm[targetKey] = val;
    }
  });

  const allWasteColumns = [
    "Organic and Wet Waste",
    "Plastic Paper Glass Waste",
    "Sanitary and Hazardous Waste",
    "Battery and Bulb Waste",
    "Construction and Demolition Waste",
    "Clothes Waste",
    "Carcasses Waste",
    "Others",
  ];
  allWasteColumns.forEach((col) => {
    if (norm[col] === undefined) {
      norm[col] = 0;
    } else if (typeof norm[col] !== "number") {
      norm[col] = (norm[col] === 1 || norm[col] === true || String(norm[col]).trim() === "1") ? 1 : 0;
    }
  });

  // API waste type normalization
  const apiWaste = row["What_kind_of_waste_do_you_obse"] || '';
  const selectedWaste = apiWaste.split(' ').filter(Boolean);
  const apiMapping = {
    'wet_waste_organic_waste': "Organic and Wet Waste",
    'dry_waste__plastic_paper_glass': "Plastic Paper Glass Waste",
    'domestic_hazardous_sanitary_na': "Sanitary and Hazardous Waste",
    'e_waste_batteries__bulbs_etc': "Battery and Bulb Waste",
    'construction_and_demolition_wa': "Construction and Demolition Waste",
    'clothes': "Clothes Waste",
    'carcasses': "Carcasses Waste",
    'others': "Others",
  };
  for (const sel of selectedWaste) {
    const column = apiMapping[sel];
    if (column) {
      norm[column] = 1;
    }
  }

  // If this row has _attachments (API row), always use those for photo/video.
  // CRITICAL: Extract attachments directly from THIS ROW's _attachments array only.
  // Never reuse attachment URLs from another row. Never cache attachment URLs globally.
  let photoUrl = "";
  let videoUrl = "";

  if (Array.isArray(row._attachments) && row._attachments.length > 0) {
    // Work on a local copy to be safe
    const attachments = row._attachments;
    const photoAttachment = attachments.find(
      att => att.mimetype === "image/jpeg" || att.mimetype === "image/heic" || att.mimetype === "image/png"
    );
    const videoAttachment = attachments.find(att => att.mimetype === "video/mp4");
    // Only use download_url from THIS row's own attachment objects
    if (photoAttachment) photoUrl = photoAttachment.download_url || "";
    if (videoAttachment) videoUrl = videoAttachment.download_url || "";
  } else {
    // Fallback to static JSON fields (Nagpur data) — these are already per-row strings
    const rawPhoto = row["Photo URL"];
    const rawVideo = row["Video URL"];
    photoUrl = (rawPhoto && rawPhoto !== "N/A") ? rawPhoto : "";
    videoUrl = (rawVideo && rawVideo !== "N/A") ? rawVideo : "";
  }

  // Always set in normalized object — guaranteed to be THIS row's media only
  norm["Photo URL"] = photoUrl;
  norm["Video URL"] = videoUrl;

  // === FIX 1: Waste quantity normalization ===
  let rawQuantity = row["Approx_Waste_Quantity_Found_at_GVP"];

  if (!rawQuantity || String(rawQuantity).trim() === "") {
    rawQuantity = row["Approx Waste Quantity Found at GVP"] ||
                  row["Waste Quantity"] ||
                  row["approx_waste_quantity_found_at_gvp"] ||
                  row["ApproxWasteQuantityFoundatGVP"] ||
                  row["Approx_quantity_of_waste_at_GV"] ||
                  "";
  }

  const cleanedQuantity = String(rawQuantity || "").trim().toLowerCase().replace(/\s+/g, '_');
  const normalizedWeight = getWasteWeight(cleanedQuantity);

  norm["waste_hath_gadi"] = normalizedWeight;           // Primary normalized numeric field
  norm["Waste Quantity Numeric"] = normalizedWeight;    // For tooltip compatibility

  // === FIX 2: Nearest Location normalization ===
  let nearestLocation = row["Nearest_Location"] || row["Nearest Location"] || row["Nearest_Landmark_nearby_GVP"] || "";
  nearestLocation = String(nearestLocation).trim().replace(/[\r\n]+/g, " ");
  norm["Nearest Location"] = nearestLocation || null;  // Set to null if empty, table handles "N/A"

  // STRICT: Choose_City from API is the ONLY source of truth for city assignment.
  // Capitalize first letter so "pune" → "Pune", "nagpur" → "Nagpur", etc.
  // Static JSON rows that don't have Choose_City will fall back to row.city.
  // If still empty → default "Nagpur" (static JSON is Nagpur historical data).
  const rawChooseCity = (row["Choose_City"] || row.city || row.City || "").toLowerCase().trim();
  norm.city = rawChooseCity
    ? rawChooseCity.charAt(0).toUpperCase() + rawChooseCity.slice(1)
    : "Nagpur"; // static JSON default

  // === FIX for Who Dispose columns ===
  norm["Who Dispose1"] = row["Who Dispose1"] || row["Who_Dispose1"] || "N/A";
  norm["Who Dispose2"] = row["Who Dispose2"] || row["Who_Dispose2"] || "N/A";
  norm["Who Dispose3"] = row["Who Dispose3"] || row["Who_Dispose3"] || "N/A";

  // Problem normalization
  const problemStaticMap = {
    "Bad Odour": "problem_bad_odour",
    "Mosquitos": "problem_mosquitos",
    "Stray Animals": "problem_stray_animals",
    "Congestion": "problem_congestion",
    "Other": "problem_other",
  };
  Object.entries(problemStaticMap).forEach(([staticKey, normKey]) => {
    norm[normKey] = row[staticKey] === 1 ? 1 : 0;
  });

  const apiProblems = row["What_kind_of_problems_do_you_e"] || '';
  const selectedProblems = apiProblems.split(' ').filter(Boolean);
  const apiProblemMapping = {
    'bad_odour': "problem_bad_odour",
    'mosquitoes': "problem_mosquitos",
    'stray_animals': "problem_stray_animals",
    'congestion': "problem_congestion",
    'other': "problem_other",
  };
  for (const sel of selectedProblems) {
    const normKey = apiProblemMapping[sel];
    if (normKey) {
      norm[normKey] = 1;
    }
  }

  // Who Dispose normalization
  norm.dispose_households = 0;
  norm.dispose_vendors = 0;
  norm.dispose_people_outside = 0;
  norm.dispose_passing_crowd = 0;
  norm.dispose_others = 0;

  // Static logic
  const staticColumns = ["Who Dispose1", "Who Dispose2", "Who Dispose3"];
  const staticCategories = new Set();
  staticColumns.forEach((col) => {
    const value = norm[col];
    if (value && value !== "N/A") {
      const cat = categorize(value);
      if (cat) {
        staticCategories.add(cat);
      }
    }
  });
  staticCategories.forEach((cat) => {
    if (cat === "Households") norm.dispose_households = 1;
    if (cat === "Vendors") norm.dispose_vendors = 1;
    if (cat === "People from Outside") norm.dispose_people_outside = 1;
    if (cat === "Passing Crowd") norm.dispose_passing_crowd = 1;
    if (cat === "Others") norm.dispose_others = 1;
  });

  // API logic
  const apiDispose = row["Who_disposes_the_waste_at_the_"] || '';
  const selectedDispose = apiDispose.split(' ').filter(Boolean);
  const apiDisposeMapping = {
    'households': "Households",
    'vendors': "Vendors",
    'people_from_outside': "People from Outside",
    'passing_crowd': "Passing Crowd",
    'others': "Others",
    'n_a': "Others",
  };
  const apiCategories = new Set();
  selectedDispose.forEach((sel) => {
    const cat = apiDisposeMapping[sel];
    if (cat) {
      apiCategories.add(cat);
    }
  });
  apiCategories.forEach((cat) => {
    if (cat === "Households") norm.dispose_households = 1;
    if (cat === "Vendors") norm.dispose_vendors = 1;
    if (cat === "People from Outside") norm.dispose_people_outside = 1;
    if (cat === "Passing Crowd") norm.dispose_passing_crowd = 1;
    if (cat === "Others") norm.dispose_others = 1;
  });

  // Solutions normalization
  norm.solution_bins_facilities = 0;
  norm.solution_technology_monitoring = 0;
  norm.solution_strict_enforcement = 0;
  norm.solution_public_awareness = 0;
  norm.solution_sanitization_roster = 0;
  norm.solution_regulatory_support = 0;
  norm.solution_efficient_collection = 0;
  norm.solution_neutral = 0;

  const solutionCats = new Set();

  // Static solutions
  const staticSolutionColumns = [
    "Solution Suggested by Interviewee1",
    "Solution Suggested by Interviewee2",
    "Solution Suggested by Interviewee3",
  ];
  staticSolutionColumns.forEach((col) => {
    const value = row[col];
    if (value && value.trim() !== "" && value !== "N/A") {
      const cat = categorizeSolution(value);
      if (cat) {
        solutionCats.add(cat);
      }
    }
  });

  // API solutions
  const apiSolution = row["What_solutions_do_you_think_wo"] || '';
  const selectedApi = apiSolution.split(' ').filter(Boolean);
  const apiSolutionMap = {
    'strict_enforcement_measures': "Strict Enforcement Measures ",
    'bins_and_facilities': "Bins and Facilities",
    'public_awareness__education': "Public Awareness & Education ",
    'sanitization_vehicle_roster': "Sanitization Vehicle Roster",
    'technology_enabledmonitoring': "Technology-Enabled Monitoring",
    'efficient_waste_collectionsystem': "Efficient Waste Collection System",
    'regulatory___administrativesupport': "Regulatory & Administrative Support",
    'neutral_feedback': "Neutral Feedback",
    'n_a': "Neutral Feedback",
  };
  selectedApi.forEach((sel) => {
    const cat = apiSolutionMap[sel];
    if (cat) {
      solutionCats.add(cat);
    }
  });

  // Set normalized fields
  solutionCats.forEach((cat) => {
    if (cat === "Bins and Facilities") norm.solution_bins_facilities = 1;
    if (cat === "Technology-Enabled Monitoring") norm.solution_technology_monitoring = 1;
    if (cat === "Strict Enforcement Measures ") norm.solution_strict_enforcement = 1;
    if (cat === "Public Awareness & Education ") norm.solution_public_awareness = 1;
    if (cat === "Sanitization Vehicle Roster") norm.solution_sanitization_roster = 1;
    if (cat === "Regulatory & Administrative Support") norm.solution_regulatory_support = 1;
    if (cat === "Efficient Waste Collection System") norm.solution_efficient_collection = 1;
    if (cat === "Neutral Feedback") norm.solution_neutral = 1;
  });

  // Setting normalization
  norm.setting_residential = 0;
  norm.setting_nallah = 0;
  norm.setting_market = 0;
  norm.setting_playground = 0;
  norm.setting_school = 0;
  norm.setting_open_plot = 0;
  norm.setting_roadside = 0;
  norm.setting_water_body = 0;
  norm.setting_other = 0;

  const settingValue = row["In_what_setting_is_the_GVP_pre"] || row["Location Type"] || row["other"] || row["Kindly_specify_the_area"] || "";
  const settingCategory = categorizeLocation(settingValue);

  if (settingCategory === "Residential Area") norm.setting_residential = 1;
  else if (settingCategory === "Nallah / Drain") norm.setting_nallah = 1;
  else if (settingCategory === "Market / Commercial Area") norm.setting_market = 1;
  else if (settingCategory === "Playground / Open Space") norm.setting_playground = 1;
  else if (settingCategory === "School / Institution") norm.setting_school = 1;
  else if (settingCategory === "Open Plot / Vacant Land") norm.setting_open_plot = 1;
  else if (settingCategory === "Roadside / Footpath / Public Path") norm.setting_roadside = 1;
  else if (settingCategory === "Water Body / Lake Area") norm.setting_water_body = 1;
  else if (settingCategory === "Other / Miscellaneous") norm.setting_other = 1;

  // Reasons normalization
  norm.reason_no_collection = 0;
  norm.reason_random_people = 0;
  norm.reason_user_fee = 0;
  norm.reason_vehicle_time = 0;
  norm.reason_narrow_road = 0;
  norm.reason_market_vendors = 0;

  // Static reasons
  if (row["No Regular Collection Vehicle"] === 1 || row["No Regular Collection Vehicle"] === true) norm.reason_no_collection = 1;
  if (row["Random People Throwing Garbage"] === 1 || row["Random People Throwing Garbage"] === true) norm.reason_random_people = 1;
  if (row["Due To User Fee"] === 1 || row["Due To User Fee"] === true) norm.reason_user_fee = 1;
  if (row["Mismatch of Vehicle Time"] === 1 || row["Mismatch of Vehicle Time"] === true) norm.reason_vehicle_time = 1;
  if (row["Due to Narrow Road"] === 1 || row["Due to Narrow Road"] === true) norm.reason_narrow_road = 1;
  if (row["Because of Market and Street Vendors"] === 1 || row["Because of Market and Street Vendors"] === true) norm.reason_market_vendors = 1;

  // API reasons
  const apiReasons = row["What_might_be_the_reason_for_w"] || '';
  const selectedReasons = apiReasons.split(' ').filter(Boolean);
  const apiReasonsMapping = {};
  Object.entries(wasteReasonsMap).forEach(([display, apis]) => {
    apis.forEach(api => apiReasonsMapping[api] = display);
  });
  selectedReasons.forEach((sel) => {
    const reason = apiReasonsMapping[sel];
    if (reason === "No Regular Collection Vehicle") norm.reason_no_collection = 1;
    if (reason === "Random People Throwing Garbage") norm.reason_random_people = 1;
    if (reason === "Due To User Fee") norm.reason_user_fee = 1;
    if (reason === "Mismatch of Vehicle Time") norm.reason_vehicle_time = 1;
    if (reason === "Due to Narrow Road") norm.reason_narrow_road = 1;
    if (reason === "Because of Market and Street Vendors") norm.reason_market_vendors = 1;
  });

  return norm;
};

// MapController - updates map center/bounds reactively (fixes whenCreated deprecation)
const MapController = ({ center, filteredDataForCards, selectedRow, onMapReady, isAllCities }) => {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  useEffect(() => {
    if (!map) return;
    const dataToUse = selectedRow ? [selectedRow] : filteredDataForCards;
    const cityCenterLatLng = L.latLng(center[0], center[1]);
    // Max distance (in meters) a GVP point can be from the city center and still
    // be treated as valid. This filters out bad/incorrect lat-lng entries in the
    // data (e.g. a point accidentally recorded near Indore while "Nagpur" is selected)
    // so they don't force the map to zoom out far beyond the selected city.
    // When "All" cities is selected, we skip this distance filter entirely so that
    // markers from both Nagpur and Pune (and any other city) are all visible.
    const MAX_DISTANCE_FROM_CENTER_METERS = 50000; // 50km

    const validPositions = dataToUse
      .filter(row => row["_Record_the_location_of_GVP_latitude"] && row["_Record_the_location_of_GVP_longitude"])
      .map(row => {
        const lat = Number(row["_Record_the_location_of_GVP_latitude"]);
        const lng = Number(row["_Record_the_location_of_GVP_longitude"]);
        return !Number.isNaN(lat) && !Number.isNaN(lng) ? [lat, lng] : null;
      })
      .filter(pos => pos !== null)
      .filter(pos => {
        if (selectedRow) return true; // always trust an explicitly selected row
        if (isAllCities) return true; // show all cities without distance filtering
        try {
          return cityCenterLatLng.distanceTo(L.latLng(pos[0], pos[1])) <= MAX_DISTANCE_FROM_CENTER_METERS;
        } catch {
          return true;
        }
      });

    if (validPositions.length === 1) {
      map.setView(validPositions[0], 15);
    } else if (validPositions.length > 1) {
      const bounds = L.latLngBounds(validPositions);
      // When showing all cities, allow zooming out further (maxZoom: 7) so both
      // Nagpur and Pune markers are visible at once; otherwise keep city-level zoom.
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: isAllCities ? 7 : 13 });
    } else {
      // No valid points - fly to city center
      map.setView(center, 13);
    }
  }, [map, filteredDataForCards, selectedRow, center, isAllCities]);

  return null;
};

// ClusteredMarkers — plain Leaflet marker clustering rendered imperatively via useMap().
// Deliberately avoids "react-leaflet-cluster" (requires React 19 / react-leaflet v5).
// leaflet.markercluster itself is a vanilla Leaflet plugin with no React dependency at all,
// so this works fine on React 18.2.0 + react-leaflet 4.2.1.
const ClusteredMarkers = ({ rows, selectedRowStart, onMarkerClick }) => {
  const map = useMap();
  const clusterGroupRef = useRef(null);

  useEffect(() => {
    if (!map) return undefined;

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 34 : count < 50 ? 42 : 50;
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;
            display:flex;align-items:center;justify-content:center;
            border-radius:9999px;
            background:linear-gradient(135deg,#6366F1,#8B5CF6);
            color:#fff;font-weight:700;font-size:13px;
            box-shadow:0 6px 16px rgba(99,102,241,0.45);
            border:2px solid #ffffff;">
            ${count}
          </div>`,
          className: "custom-cluster-icon",
          iconSize: [size, size],
        });
      },
    });

    rows.forEach((row) => {
      const lat = Number(row["_Record_the_location_of_GVP_latitude"]);
      const lng = Number(row["_Record_the_location_of_GVP_longitude"]);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const ward = row["GVP Ward"] || "";
      // Color markers by waste volume (red = high, orange = medium, green = low),
      // falling back to the legacy ward-based color when volume data is missing.
      const wasteVolume = Number(row["waste_hath_gadi"]) || 0;
      const colorName =
        wasteVolume >= 7 ? "red" : wasteVolume >= 3 ? "orange" : wasteVolume > 0 ? "green" : WARD_COLOR_MAP[ward] || "blue";
      const isMarkerSelected = selectedRowStart === row.start;

      const icon = L.icon({
        iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${colorName}.png`,
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${colorName}.png`,
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        iconSize: isMarkerSelected ? [32, 52] : [25, 41],
        iconAnchor: isMarkerSelected ? [16, 52] : [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
        className: isMarkerSelected ? "marker-pulse" : "",
      });

      const marker = L.marker([lat, lng], { icon });

      // Render the exact same TooltipContent React component to a static HTML
      // string — same info, same normalized fields, just rendered outside React's
      // tree since vanilla Leaflet layers aren't React children.
      const tooltipHtml = `
        <div style="max-width:480px;min-width:400px;padding:12px;background:white;border-radius:14px;box-shadow:0 12px 28px rgba(79,70,229,0.18);border:1px solid #E0E7FF;">
          <div style="margin-bottom:6px;font-weight:700;color:#4338CA;">📍 Garbage Point Info</div>
          ${ReactDOMServer.renderToStaticMarkup(<TooltipContent row={row} />)}
        </div>
      `;
      marker.bindTooltip(tooltipHtml, {
        direction: "auto",
        offset: [0, -20],
        opacity: 1,
        sticky: true,
        className: "custom-tooltip",
      });

      marker.on("click", () => onMarkerClick(row));

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    return () => {
      map.removeLayer(clusterGroup);
      clusterGroupRef.current = null;
    };
  }, [map, rows, selectedRowStart, onMarkerClick]);

  return null;
};

// City Slicer Component - cities are dynamic, derived from actual data
const CitySlicer = ({ selectedCity, setSelectedCity, availableCities }) => {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 w-full">
      <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
        Select City
      </h2>
      <div className="relative w-full">
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full appearance-none text-center pl-3 pr-9 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="All">All</option>
          {availableCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
      </div>
    </div>
  );
};

function App() {
  const [apiData, setApiData] = useState([]);
  const [normalizedMergedData, setNormalizedMergedData] = useState([]);
  const [selectedWards, setSelectedWards] = useState([]);
  const [selectedRowStart, setSelectedRowStart] = useState(null);
  const mapInstanceRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isKeyFindingsOpen, setIsKeyFindingsOpen] = useState(false);
  const [mapLayerType, setMapLayerType] = useState("street"); // "street" | "satellite"
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const dashboardCaptureRef = useRef(null); // wraps cards + wards + photos + map (everything currently on screen)
  const analyticsCaptureRef = useRef(null); // wraps just the charts inside the Key Findings accordion

  const handleMapReady = useCallback((map) => {
    mapInstanceRef.current = map;
  }, []);

  const isSmallScreen = useMediaQuery({ query: "(max-width: 768px)" });

  const staticNormalized = useMemo(() => staticDataRaw.map(normalizeRow), []);

  useEffect(() => {
    // MERGE RULE — Combine static JSON + API data using a Map keyed on row.start.
    // Static JSON = historical Nagpur data.
    // API = live data for all cities (Pune, Nagpur, etc.).
    //
    // Map(start) ensures:
    //   1. Every record is uniquely identified by its start timestamp.
    //   2. If the same start appears in both static and API data, the API version
    //      (which comes later) replaces the entire static row — no property merging.
    //   3. No field from another row ever contaminates this row.
    //
    // Static Nagpur data is loaded first; API data overwrites on key collision.
    const mergeMap = new Map();
    for (const row of staticNormalized) {
      const key = row.start;
      if (key !== undefined && key !== null && key !== "") {
        mergeMap.set(key, row);
      } else {
        // No start key — use a unique fallback so record is kept
        mergeMap.set(`_static_fallback_${mergeMap.size}`, row);
      }
    }
    for (const row of apiData) {
      const key = row.start;
      if (key !== undefined && key !== null && key !== "") {
        // Entire row replaces — never Object.assign, never copy fields from old row
        mergeMap.set(key, row);
      } else {
        mergeMap.set(`_api_fallback_${mergeMap.size}`, row);
      }
    }
    setNormalizedMergedData([...mergeMap.values()]);
  }, [staticNormalized, apiData]);

  useEffect(() => {
    fetch("https://kobo-proxy.onrender.com/api/kobo")
      .then((res) => {
        setIsLoading(false);
        if (!res.ok) {
          setError(`API failure, status: ${res.status}`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data !== null) {
          const rawResults = Array.isArray(data.results) ? data.results : [];
          const normalizedApi = rawResults.map(normalizeRow);
          setApiData(normalizedApi);
        }
      })
      .catch((err) => {
        setIsLoading(false);
        setError(`API Error: ${err.message}`);
      });
  }, []);

  const uniqueWards = useMemo(() => {
    const cityLower = selectedCity.toLowerCase().trim();
    const wardsSet = new Set(
      normalizedMergedData
        .filter((row) => cityLower === "all" || (row.city || "Nagpur").toLowerCase().trim() === cityLower)
        .map((row) =>
          row["GVP Ward"] !== null && row["GVP Ward"] !== undefined
            ? String(row["GVP Ward"])
            : null
        )
        .filter(Boolean)
    );
    return Array.from(wardsSet).sort((a, b) => Number(a) - Number(b));
  }, [normalizedMergedData, selectedCity]);

  const filteredData = useMemo(() => {
    return normalizedMergedData.filter((row) => {
      const rowCity = (row.city || "Nagpur").toLowerCase().trim();
      const selected = selectedCity.toLowerCase().trim();
      const cityMatch = selected === "all" || rowCity === selected;
      const wardMatch = selectedWards.length === 0 || selectedWards.includes(String(row["GVP Ward"]));
      return cityMatch && wardMatch;
    });
  }, [normalizedMergedData, selectedWards, selectedCity]);

  const filteredTableData = useMemo(() => {
    return filteredData;
  }, [filteredData]);

  // Look up selected row by its unique start key — immune to filter/sort changes.
  // Never use array index; filteredTableData order can change when filters change.
  const selectedRow = selectedRowStart !== null
    ? filteredTableData.find(r => r.start === selectedRowStart) || null
    : null;

  const filteredDataForCards = useMemo(() => {
    return selectedRow ? [selectedRow] : filteredData;
  }, [selectedRow, filteredData]);

  // When a marker/row is selected show that single point's stats; otherwise city total
  const totalGarbagePoints = selectedRow ? 1 : filteredData.length;

  const totalHathGadiVolume = useMemo(() => {
    return filteredDataForCards.reduce((sum, row) => {
      const weight = Number(row["waste_hath_gadi"]) || 0;
      return sum + weight;
    }, 0);
  }, [filteredDataForCards]);

  const pieData = useMemo(() => {
    return selectedRow
      ? calculatePieForRow(selectedRow)
      : calculateWasteTypeCounts(filteredDataForCards);
  }, [selectedRow, filteredDataForCards]);

  const problemsData = useMemo(() => calculateProblemsData(filteredDataForCards), [filteredDataForCards]);
  const reasonsData = useMemo(() => calculateReasonsData(filteredDataForCards), [filteredDataForCards]);
  const whoDisposeData = useMemo(() => calculateWhoDisposeData(filteredDataForCards), [filteredDataForCards]);
  const settingData = useMemo(() => calculateSettingData(filteredDataForCards), [filteredDataForCards]);
  const solutionData = useMemo(() => calculateSolutionData(filteredDataForCards), [filteredDataForCards]);

  const handleMarkerClick = (row) => {
    // CRITICAL: Always use row.start as the unique key for selection.
    // Never use lat/lng/ward composite — multiple records can share those values.
    const rowStart = row.start;

    // If in "All" cities view and marker has a city, switch to that city first
    const markerCity = row.city || "Nagpur";
    if (selectedCity === "All" && markerCity && markerCity !== "All") {
      setSelectedCity(markerCity);
      // After city switch, select this specific row by its start key
      setSelectedRowStart(rowStart);
      return;
    }

    // Toggle selection: clicking the already-selected marker deselects it
    if (selectedRowStart === rowStart) {
      setSelectedRowStart(null);
    } else {
      setSelectedRowStart(rowStart);
    }

    if (mapInstanceRef.current) {
      const lat = Number(row["_Record_the_location_of_GVP_latitude"]);
      const lng = Number(row["_Record_the_location_of_GVP_longitude"]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        try {
          mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true, duration: 0.5 });
        } catch (e) {}
      }
    }
  };

  const handleRowClick = (rowStart) => {
    // rowStart is row.start — the unique primary key for this record.
    if (selectedRowStart === rowStart) {
      setSelectedRowStart(null);
    } else {
      setSelectedRowStart(rowStart);
    }
  };

  const handleWardChange = (e) => {
    const ward = e.target.value;
    const isChecked = e.target.checked;
    setSelectedWards((prev) =>
      isChecked ? [...prev, ward] : prev.filter((w) => w !== ward)
    );
  };

  const handleSelectAll = () => {
    setSelectedWards(uniqueWards);
  };

  const isNagpurSelected = selectedCity === "Nagpur";
  const isPuneSelected = selectedCity === "Pune";
  const isAllSelected = selectedCity === "All";
  const isDashboardCity = isNagpurSelected || isPuneSelected || isAllSelected;

  // ===================== DASHBOARD SCREENSHOT EXPORT =====================
  // Captures EXACTLY what is currently on screen — cards, wards, photos
  // list, and the map — plus the Key Findings charts (opening that popup
  // briefly if it wasn't already open, then restoring it to whatever state
  // it was in before). Everything is stitched into one tall, colorful PNG.
  const handleDownloadPDF = useCallback(async () => {
    if (!dashboardCaptureRef.current) {
      window.alert("Nothing to capture yet — please wait for the dashboard to load.");
      return;
    }

    setIsCapturingScreenshot(true);

    // Remember whether the analytics popup was already open, so we can put
    // things back exactly as they were once the PDF is done.
    const wasKeyFindingsOpen = isKeyFindingsOpen;

    try {
      const captureOptions = {
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: Math.min(window.devicePixelRatio || 1, 2),
        logging: false,
      };

      // 1) Capture the main dashboard (cards, wards, photos, map) as it looks right now
      const dashboardCanvas = await html2canvas(dashboardCaptureRef.current, captureOptions);

      // 2) Make sure the analytics charts are actually rendered, then capture them too
      let analyticsCanvas = null;
      if (isDashboardCity) {
        if (!wasKeyFindingsOpen) {
          setIsKeyFindingsOpen(true);
          // Give React + the charts a moment to render before capturing
          await new Promise((resolve) => setTimeout(resolve, 700));
        }
        if (analyticsCaptureRef.current) {
          analyticsCanvas = await html2canvas(analyticsCaptureRef.current, captureOptions);
        }
        if (!wasKeyFindingsOpen) {
          setIsKeyFindingsOpen(false);
        }
      }

      // 3) Stitch both canvases into a single tall image
      const gap = 24;
      const width = Math.max(dashboardCanvas.width, analyticsCanvas ? analyticsCanvas.width : 0);
      const height =
        dashboardCanvas.height + (analyticsCanvas ? gap + analyticsCanvas.height : 0);

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = width;
      finalCanvas.height = height;
      const ctx = finalCanvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(dashboardCanvas, 0, 0);
      if (analyticsCanvas) {
        ctx.drawImage(analyticsCanvas, 0, dashboardCanvas.height + gap);
      }

      // 4) Drop the full image into a PDF sized to fit it exactly — nothing
      // gets cropped or split across pages, it's one tall page start to finish.
      const imgData = finalCanvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: width > height ? "landscape" : "portrait",
        unit: "px",
        format: [width, height],
        compress: true,
      });
      pdf.addImage(imgData, "PNG", 0, 0, width, height);

      const dateStamp = new Date().toISOString().slice(0, 10);
      const wardForFilename = selectedRow
        ? `Ward${selectedRow["GVP Ward"] ?? "NA"}`
        : selectedWards.length > 0
        ? `Ward-${selectedWards.join("-")}`
        : "AllWards";
      const filename = `BharatGarbageTracker_${selectedCity}_${wardForFilename}_${dateStamp}.pdf`;

      pdf.save(filename);
    } catch (err) {
      window.alert("Something went wrong while creating the PDF. Please try again.");
    } finally {
      setIsCapturingScreenshot(false);
    }
  }, [isKeyFindingsOpen, isDashboardCity, selectedRow, selectedWards, selectedCity]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Dynamically derive available cities from merged data (sorted alphabetically)
  const availableCities = useMemo(() => {
    const citySet = new Set(
      normalizedMergedData
        .map(row => row.city || "")
        .filter(c => c && c !== "Unknown")
    );
    return Array.from(citySet).sort();
  }, [normalizedMergedData]);

  // City center coords map — fallback to a default center if city not listed
  const CITY_CENTERS = {
    "Pune": [18.5204, 73.8567],
    "Nagpur": [21.135, 79.085],
  };
  const mapCenter = isAllSelected
    ? [19.8, 76.5]
    : CITY_CENTERS[selectedCity] || [20.5937, 78.9629]; // India center as default

  useEffect(() => {
    if (mapInstanceRef.current && selectedRow) {
      const lat = Number(selectedRow["_Record_the_location_of_GVP_latitude"]);
      const lng = Number(selectedRow["_Record_the_location_of_GVP_longitude"]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        try {
          mapInstanceRef.current.flyTo([lat, lng], Math.max(mapInstanceRef.current.getZoom(), 15), {
            animate: true,
            duration: 0.6,
          });
        } catch (e) {}
      }
    }
  }, [selectedRow]);

  useEffect(() => {
    setSelectedRowStart(null);
  }, [selectedWards, normalizedMergedData]);

  // Auto-select Ward 8 when switching to Pune; clear selection for other cities
  useEffect(() => {
    setSelectedRowStart(null);
    if (selectedCity === "Pune") {
      const puneWards = Array.from(
        new Set(
          normalizedMergedData
            .filter(r => (r.city || "").toLowerCase() === "pune")
            .map(r => r["GVP Ward"] !== null && r["GVP Ward"] !== undefined ? String(r["GVP Ward"]) : null)
            .filter(Boolean)
        )
      ).sort((a, b) => Number(a) - Number(b));
      if (puneWards.includes("8")) {
        setSelectedWards(["8"]);
      } else if (puneWards.length > 0) {
        setSelectedWards([puneWards[0]]);
      } else {
        setSelectedWards([]);
      }
    } else {
      // For "All" and other cities, show all data with no ward filter
      setSelectedWards([]);
    }
  }, [selectedCity]); // eslint-disable-line react-hooks/exhaustive-deps



  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-cyan-50/40 min-h-screen font-sans">
      <style>{`
        @keyframes markerPulse {
          0% { filter: drop-shadow(0 0 0 rgba(99,102,241,0.7)); transform: scale(1); }
          70% { filter: drop-shadow(0 0 10px rgba(99,102,241,0)); transform: scale(1.08); }
          100% { filter: drop-shadow(0 0 0 rgba(99,102,241,0)); transform: scale(1); }
        }
        .marker-pulse { animation: markerPulse 1.4s ease-in-out infinite; }
      `}</style>
      {/* Header Section */}
      <div className="text-center mb-6 bg-white/70 backdrop-blur rounded-2xl shadow-sm border border-white/60 py-4">
        <div className="flex justify-center items-center gap-3 mb-2">
          <img
            src={Mainicon}
            alt="Mainicon Logo"
            className="h-10 w-auto"
          
          />

          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
            Bharat Garbage Tracker
          </h1>
        </div>
        
        {/* Menu Bar - Always Visible */}
        <nav className="flex justify-center space-x-8 mt-4 border-b border-gray-200 pb-2">
          <Link
            to="/"
            className="text-gray-600 hover:text-indigo-600 font-semibold transition duration-300"
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-gray-600 hover:text-indigo-600 font-semibold transition duration-300"
          >
            About the Initiative
          </Link>
          <Link
            to="/partners"
            className="text-gray-600 hover:text-indigo-600 font-semibold transition duration-300"
          >
            Our Partners
          </Link>
          <Link to="/impact" className="text-gray-600 hover:text-indigo-600 font-semibold transition duration-300">Impact</Link>
          <a
            href="https://ee.kobotoolbox.org/x/JoXcMcRe"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-indigo-600 font-semibold transition duration-300"
          >
            + Enter Data
          </a>
        </nav>
      </div>

      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/impact" element={<Impact />} />
        <Route path="/" element={
          <>
            <div ref={dashboardCaptureRef} className="flex flex-col lg:flex-row gap-6 mt-6">
              {/* LEFT COLUMN */}
              <div className="w-full lg:w-[460px] space-y-6">

                <CitySlicer selectedCity={selectedCity} setSelectedCity={setSelectedCity} availableCities={availableCities} />

                {isLoading ? (
                  <div className="mt-6 p-10 bg-white rounded-xl shadow-2xl text-center">
                    <p className="text-2xl font-bold text-gray-800">Loading data...</p>
                  </div>
                ) : error ? (
                  <div className="mt-6 p-10 bg-white rounded-xl shadow-2xl text-center border-4 border-red-400">
                    <p className="text-2xl font-bold text-red-600">Error: {error}</p>
                  </div>
                ) : isDashboardCity ? (
                  <>
                    {/* Download Summary Button — captures the whole dashboard (cards, map, and charts) as one colorful PDF */}
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isCapturingScreenshot}
                      className="group w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-300/60 hover:shadow-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                      style={{ display: "table", height: "48px", padding: 0 }}
                    >
                      <span style={{ display: "table-cell", verticalAlign: "middle", textAlign: "center" }}>
                        <FaFilePdf
                          className="text-lg group-hover:scale-110 transition-transform duration-300"
                          style={{ display: "inline-block", verticalAlign: "middle", marginRight: "8px" }}
                        />
                        <span style={{ display: "inline-block", verticalAlign: "middle" }}>
                          {isCapturingScreenshot ? "Generating PDF..." : "Download Summary"}
                        </span>
                        <FaDownload
                          className="text-sm opacity-80"
                          style={{ display: "inline-block", verticalAlign: "middle", marginLeft: "8px" }}
                        />
                      </span>
                    </button>

                    {/* Summary Cards */}
                    <div className="flex flex-row flex-nowrap gap-4 overflow-x-auto pb-2 ">
                      <div className={`relative overflow-hidden bg-white/80 backdrop-blur p-4 rounded-2xl shadow-lg text-center border border-gray-100 border-t-4 border-t-indigo-500 flex flex-col justify-center hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${CARD_SIZE_CLASSES}`}>
                        <div className="mx-auto mb-1 flex items-center justify-center w-9 h-9 rounded-full bg-indigo-50 text-indigo-500">
                          <FaMapMarkerAlt />
                        </div>
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Total Garbage Points
                        </h2>
                        <p className="text-4xl font-extrabold mt-1 text-gray-900">
                          <CountUp end={totalGarbagePoints} duration={0.8} separator="," />
                        </p>
                      </div>

                      <div className={`relative overflow-hidden bg-white/80 backdrop-blur p-4 rounded-2xl shadow-lg text-center border border-gray-100 border-t-4 border-t-emerald-500 flex flex-col justify-center hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${CARD_SIZE_CLASSES}`}>
                        <div className="mx-auto mb-1 flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 text-emerald-500">
                          <FaRecycle />
                        </div>
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          GVP Waste Volume (Hath Gadi)
                        </h2>
                        <p className="text-4xl font-extrabold mt-1 text-gray-900">
                          <CountUp end={Math.round(totalHathGadiVolume)} duration={0.8} separator="," />
                        </p>
                      </div>
                    </div>

                    {/* Ward Selector */}
                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 relative ">
                      <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">Wards</h2>
                      <div className="relative">
                        <button
                          onClick={toggleDropdown}
                          className="w-full p-2 border rounded-lg shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 flex justify-between items-center"
                        >
                          {selectedWards.length > 0
                            ? `${selectedWards.length} ward(s) selected`
                            : "Select Wards"}
                          <span className="ml-2">▼</span>
                        </button>
                        {isDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            <label className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedWards.length === uniqueWards.length}
                                onChange={handleSelectAll}
                                className="form-checkbox h-4 w-4 text-indigo-500"
                              />
                              <span className="text-sm">All</span>
                            </label>
                            {uniqueWards.map((ward) => (
                              <label key={ward} className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer">
                                <input
                                  type="checkbox"
                                  value={ward}
                                  checked={selectedWards.includes(ward)}
                                  onChange={handleWardChange}
                                  className="form-checkbox h-4 w-4 text-indigo-500"
                                />
                                <span className="text-sm">{ward}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                      <DataTable
                        data={selectedRow ? [selectedRow] : filteredDataForCards}
                        onRowClick={handleRowClick}
                        selectedRowStart={selectedRowStart}
                      />
                    </div>

                  </>
                ) : (
                  <div className="mt-6 p-10 bg-white rounded-xl shadow-2xl text-center border-4 border-yellow-400">
                    <p className="text-4xl font-extrabold text-gray-800">
                      Coming Soon!
                    </p>
                    <p className="mt-4 text-xl text-gray-600">
                      Data and visualization for {selectedCity} will be available in a future update.
                    </p>
                    <button
                      onClick={() => setSelectedCity("Nagpur")}
                      className="mt-8 px-6 py-3 bg-yellow-500 text-white font-semibold text-lg rounded-lg shadow-md hover:bg-yellow-600 transition duration-300"
                    >
                      Go back to Nagpur Dashboard
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN - Map + Key Findings */}
              <div className="flex-1 lg:space-y-6">

                {isDashboardCity ? (
                  <>
                    {/* Map */}
                    <div className="h-[750px] lg:h-[900px] relative">
                      <MapContainer
                        key={selectedCity}
                        center={mapCenter}
                        zoom={isAllSelected ? 6 : 13}
                        className="w-full h-full rounded-2xl shadow-xl border border-gray-100"
                      >
                        {mapLayerType === "satellite" ? (
                          <>
                            <TileLayer
                              attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
                              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                              crossOrigin="anonymous"
                            />
                            <TileLayer
                              attribution='Labels &copy; Esri'
                              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                              crossOrigin="anonymous"
                            />
                          </>
                        ) : (
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            crossOrigin="anonymous"
                          />
                        )}
                        <MapController
                          center={mapCenter}
                          filteredDataForCards={filteredDataForCards}
                          selectedRow={selectedRow}
                          onMapReady={handleMapReady}
                          isAllCities={isAllSelected}
                        />
                        <ClusteredMarkers
                          rows={(selectedRow ? [selectedRow] : filteredDataForCards).filter(
                            (row) => row["_Record_the_location_of_GVP_latitude"] && row["_Record_the_location_of_GVP_longitude"]
                          )}
                          selectedRowStart={selectedRowStart}
                          onMarkerClick={handleMarkerClick}
                        />
                      </MapContainer>

                      {/* Street / Satellite Toggle */}
                      <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-100 p-1 flex gap-1">
                        <button
                          type="button"
                          onClick={() => setMapLayerType("street")}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                            mapLayerType === "street"
                              ? "bg-indigo-600 text-white shadow"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          Street
                        </button>
                        <button
                          type="button"
                          onClick={() => setMapLayerType("satellite")}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                            mapLayerType === "satellite"
                              ? "bg-indigo-600 text-white shadow"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          Satellite
                        </button>
                      </div>

                      {/* Mini Legend */}
                      <div className="absolute bottom-3 right-3 z-[1000] bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-100 px-3 py-2 text-xs space-y-1">
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> High waste</div>
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> Medium waste</div>
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Low waste</div>
                      </div>
                    </div>

                  </>
                ) : (
                  <div className="hidden lg:block w-full h-full">
                  </div>
                )}
              </div>
            </div>
            {isDashboardCity ? (
              <>
                <div
                  className="flex justify-center items-center gap-2 mt-8 cursor-pointer group"
                  onClick={() => setIsKeyFindingsOpen(!isKeyFindingsOpen)}
                >
                  <FaChartBar className="text-indigo-500 group-hover:scale-110 transition-transform duration-300" />
                  <h2 className="text-2xl font-bold text-black">
                    Key Findings from the GVP Survey
                  </h2>
                  <span className="pointer-events-none">{isKeyFindingsOpen ? "▲" : "▼"}</span>
                </div>

                {/* Key Findings Accordion — expands inline on the same vertical
                    page when the arrow above is clicked. No popups/modals. */}
                {isKeyFindingsOpen && (
                  <div ref={analyticsCaptureRef} className="w-full space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 w-full hover:shadow-xl transition-shadow duration-300">
                      <h3 className="text-center text-sm sm:text-base font-semibold mb-2 text-gray-700">
                        Breakdown by Waste Type
                      </h3>

                      <div className="w-full h-80 sm:h-72 md:h-80 lg:h-96">
                        <ResponsiveContainer width="100%" height={340}>
                          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={isSmallScreen ? 60 : 90}
                              innerRadius={isSmallScreen ? 30 : 60}
                              paddingAngle={3}
                              label={renderCustomizedLabel(isSmallScreen)}
                              labelLine={true}
                              minAngle={5}
                              stroke="#ffffff"
                              strokeWidth={2}
                              isAnimationActive={!isCapturingScreenshot}
                            >
                              {pieData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={TOOLTIP_CONTENT_STYLE}
                              labelStyle={TOOLTIP_LABEL_STYLE}
                              itemStyle={TOOLTIP_ITEM_STYLE}
                              formatter={(value, name) => [`${value} (${pieData.length ? ((value / pieData.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1) : 0}%)`, name]}
                            />
                            <Legend
                              verticalAlign="bottom"
                              iconType="circle"
                              wrapperStyle={{ fontSize: isSmallScreen ? 10 : 12, paddingTop: 8 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-shadow duration-300">
                      <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                        Reasons for Waste Accumulation
                      </h2>
                      <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                        <ResponsiveContainer width="100%" height={Math.max(300, reasonsData.length * 40)}>
                          <BarChart data={reasonsData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={isSmallScreen ? 120 : 180}
                              tick={{ fontSize: isSmallScreen ? 11 : 14 }}
                            />
                            <Tooltip
                              formatter={(value) => `${value.toFixed(1)}%`}
                              contentStyle={TOOLTIP_CONTENT_STYLE}
                              labelStyle={TOOLTIP_LABEL_STYLE}
                              itemStyle={TOOLTIP_ITEM_STYLE}
                              cursor={TOOLTIP_CURSOR_STYLE}
                            />
                            <Bar dataKey="value" barSize={isSmallScreen ? 14 : 22}
                              label={renderCustomBarLabel}
                                radius={[0, 6, 6, 0]}
                                activeBar={{ fillOpacity: 0.85 }}
                                isAnimationActive={!isCapturingScreenshot}
                              >
                              {reasonsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    <div className="space-y-6">
                      {/* Problems */}
                      <div className="bg-white px-6 py-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 overflow-x-auto">
                        <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                          Top Problems Faced by Residents around GVP
                        </h2>
                        <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                          <ResponsiveContainer width="100%" height={Math.max(300, problemsData.length * 40)}>
                            <BarChart data={problemsData} layout="vertical"
                              margin={{
                                top: 10,
                                right: isSmallScreen ? 50 : 90,
                                left: 10,
                                bottom: 10,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                type="number"
                                domain={[0, 100]}
                                tickFormatter={(v) => `${v}%`}
                              />
                              <YAxis
                                dataKey="name"
                                type="category"
                                width={isSmallScreen ? 70 : 130}
                                tick={{ fontSize: isSmallScreen ? 9 : 12 }}
                                tickFormatter={(value) =>
                                  value.length > 18 ? value.slice(0, 18) + "…" : value
                                }
                              />
                              <Tooltip
                                formatter={(v) => `${v.toFixed(1)}%`}
                                contentStyle={TOOLTIP_CONTENT_STYLE}
                                labelStyle={TOOLTIP_LABEL_STYLE}
                                itemStyle={TOOLTIP_ITEM_STYLE}
                                cursor={TOOLTIP_CURSOR_STYLE}
                              />
                              <Bar
                                dataKey="value"
                                barSize={isSmallScreen ? 14 : 22}
                                label={renderCustomBarLabel}
                                radius={[0, 6, 6, 0]}
                                activeBar={{ fillOpacity: 0.85 }}
                                isAnimationActive={!isCapturingScreenshot}
                              >
                                {problemsData.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={BAR_COLORS[i % BAR_COLORS.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Settings */}
                      <div className="bg-white px-6 py-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 overflow-x-auto">
                        <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                          Top Settings Where GVPs Are Found
                        </h2>
                        <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                          <ResponsiveContainer width="100%" height={Math.max(300, settingData.length * 40)}>
                            <BarChart data={settingData}
                              layout="vertical"
                              margin={{
                                top: 10,
                                right: isSmallScreen ? 50 : 90,
                                left: 10,
                                bottom: 10,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                type="number"
                                domain={[0, 100]}
                                tickFormatter={(v) => `${v}%`}
                              />
                              <YAxis
                                dataKey="name"
                                type="category"
                                width={isSmallScreen ? 90 : 160}
                                tick={{ fontSize: isSmallScreen ? 10 : 14 }}
                              />
                              <Tooltip
                                formatter={(v) => `${v.toFixed(1)}%`}
                                contentStyle={TOOLTIP_CONTENT_STYLE}
                                labelStyle={TOOLTIP_LABEL_STYLE}
                                itemStyle={TOOLTIP_ITEM_STYLE}
                                cursor={TOOLTIP_CURSOR_STYLE}
                              />
                              <Bar
                                dataKey="value"
                                barSize={isSmallScreen ? 14 : 22}
                                label={renderCustomBarLabel}
                                radius={[0, 6, 6, 0]}
                                activeBar={{ fillOpacity: 0.85 }}
                                isAnimationActive={!isCapturingScreenshot}
                              >
                                {settingData.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={BAR_COLORS[i % BAR_COLORS.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Who Dispose */}
                      <div className="bg-white px-6 py-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 overflow-x-auto">
                        <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                          Who is Disposing the most Waste (as per Citizens)
                        </h2>
                        <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                          <ResponsiveContainer width="100%" height={Math.max(300, whoDisposeData.length * 40)}>
                            <BarChart data={whoDisposeData}
                              layout="vertical"
                              margin={{
                                top: 10,
                                right: isSmallScreen ? 50 : 90,
                                left: 10,
                                bottom: 10,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                type="number"
                                domain={[0, 100]}
                                tickFormatter={(v) => `${v}%`}
                              />
                              <YAxis
                                dataKey="name"
                                type="category"
                                width={isSmallScreen ? 90 : 160}
                                tick={{ fontSize: isSmallScreen ? 10 : 14 }}
                              />
                              <Tooltip
                                formatter={(v) => `${v.toFixed(1)}%`}
                                contentStyle={TOOLTIP_CONTENT_STYLE}
                                labelStyle={TOOLTIP_LABEL_STYLE}
                                itemStyle={TOOLTIP_ITEM_STYLE}
                                cursor={TOOLTIP_CURSOR_STYLE}
                              />
                              <Bar
                                dataKey="value"
                                barSize={isSmallScreen ? 14 : 22}
                                label={renderCustomBarLabel}
                                radius={[0, 6, 6, 0]}
                                activeBar={{ fillOpacity: 0.85 }}
                                isAnimationActive={!isCapturingScreenshot}
                              >
                                {whoDisposeData.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={BAR_COLORS[i % BAR_COLORS.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Solutions Chart (swapped with Reasons) */}
                      <div className="bg-white px-6 py-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 overflow-x-auto">
                        <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                          Top Solutions Suggested (by Citizens)
                        </h2>
                        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                          <ResponsiveContainer width="100%" height={Math.max(300, solutionData.length * 40)}>
                            <BarChart
                              data={solutionData}
                              layout="vertical"
                              margin={{
                                top: 10,
                                right: isSmallScreen ? 50 : 90,
                                left: 10,
                                bottom: 10,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                type="number"
                                domain={[0, 100]}
                                tickFormatter={(v) => `${v}%`}
                              />
                              <YAxis
                                dataKey="name"
                                type="category"
                                width={isSmallScreen ? 90 : 160}
                                tick={{ fontSize: isSmallScreen ? 10 : 14 }}
                              />
                              <Tooltip
                                formatter={(v) => `${v.toFixed(1)}%`}
                                contentStyle={TOOLTIP_CONTENT_STYLE}
                                labelStyle={TOOLTIP_LABEL_STYLE}
                                itemStyle={TOOLTIP_ITEM_STYLE}
                                cursor={TOOLTIP_CURSOR_STYLE}
                              />
                              <Bar
                                dataKey="value"
                                barSize={isSmallScreen ? 14 : 22}
                                label={renderCustomBarLabel}
                                radius={[0, 6, 6, 0]}
                                activeBar={{ fillOpacity: 0.85 }}
                                isAnimationActive={!isCapturingScreenshot}
                              >
                                {solutionData.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={BAR_COLORS[i % BAR_COLORS.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
                )}

                {/* Footer — always visible, independent of the popup */}
                <footer className="mt-12 pb-4 text-center">
                  <a
                    href="https://themetropolitaninstitute.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl font-bold text-gray-600 hover:text-blue-400 transition duration-300"
                  >
                    Developed by The Metropolitan Institute
                  </a>
                </footer>
              </>
            ) : (
              <div className="hidden lg:block w-full h-full">
              </div>
            )}
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
