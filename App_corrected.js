import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Tooltip as LeafletTooltip } from "react-leaflet";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  fill,
  name,
  percent,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const textAnchor = x > cx ? "start" : "end";
  const labelX = x + (x > cx ? 5 : -5);
  const percentage = (percent * 100).toFixed(0);

  if (percentage < 3) return null;

  return (
    <g>
      <polyline
        points={[
          [
            cx + outerRadius * Math.cos(-midAngle * RADIAN),
            cy + outerRadius * Math.sin(-midAngle * RADIAN),
          ],
          [x, y],
          [labelX, y],
        ]
          .map((p) => p.join(","))
          .join(" ")}
        stroke={fill}
        fill="none"
        strokeWidth={1}
      />
      <text
        x={labelX}
        y={y - 5}
        fill="#333"
        textAnchor={textAnchor}
        dominantBaseline="central"
        style={{ fontSize: "12px", fontWeight: "bold" }}
      >
        {`${percentage}%`}
      </text>
      <text
        x={labelX}
        y={y + 10}
        fill="#666"
        textAnchor={textAnchor}
        dominantBaseline="central"
        style={{ fontSize: "11px" }}
      >
        {name}
      </text>
    </g>
  );
};

// Tooltip Function (Full Measure)
const getGarbagePointInfo = (row) => {
  const LB = "\n";

  const Ward = row["GVP Ward"] ? `Ward: ${row["GVP Ward"]}${LB}` : "";
  const NearestLocationRaw = row["Nearest Location"];
  const NearestLocation = NearestLocationRaw
    ? `Nearest Location: ${NearestLocationRaw.replace(/\r|\n/g, " ").trim()}${LB}`
    : "";

  const Comments = row["Comments On GVP"]
    ? `Comments: ${row["Comments On GVP"]}${LB}`
    : "";

  const wasteTypesMap = {
    "Organic and Wet Waste": "• Organic and Wet Waste",
    "Plastic Paper Glass Waste": "• Plastic Paper Glass Waste",
    "Sanitary and Hazardous Waste": "• Sanitary and Hazardous Waste",
    "Battery and Bulb Waste": "• Battery and Bulb Waste",
    "Construction and Demolition Waste": "• Construction and Demolition Waste",
    "Clothes Waste": "• Clothes Waste",
    "Carcasses Waste": "• Carcasses Waste",
    Others: "• Others",
  };

  const WasteTypes = Object.keys(wasteTypesMap)
    .filter((k) => row[k] === 1 || row[k] === true)
    .map((k) => wasteTypesMap[k])
    .join(LB);

  const OtherWaste = row["Other Waste Found"]
    ? `• ${row["Other Waste Found"]}`
    : "";

  const WasteTypeSection =
    WasteTypes || OtherWaste
      ? `Waste Type:${LB}${WasteTypes}${WasteTypes && OtherWaste ? LB : ""}${OtherWaste}${LB}`
      : "";

  const WasteQty = row["Waste Quantity Numeric"]
    ? `Waste Volume: ${row["Waste Quantity Numeric"]}${LB}`
    : "";

  const Setting = row["In_what_setting_is_the_GVP_pre"]
    ? `In What Setting is GVP Present: ${row["In_what_setting_is_the_GVP_pre"]}${LB}`
    : "";

  const Area = row["Kindly_specify_the_area"]
    ? `Area: ${row["Kindly_specify_the_area"]}${LB}`
    : "";

  const Section_GVP_Body =
    Ward + NearestLocation + Comments + WasteTypeSection + WasteQty + Setting + Area;

  const Section_GVP = Section_GVP_Body
    ? `GVP Information${LB}${Section_GVP_Body}`
    : "";

  const CivicSession = row["Civic Authority Conduct Any Session"]
    ? `Has The Civic Authority Conducted Any Awareness Session: ${row["Civic Authority Conduct Any Session"]}${LB}`
    : "";

  const Complained = row["Have Interviewees Complained to Authority"]
    ? `Have Interviewees Complained to Authorities: ${row["Have Interviewees Complained to Authority"]}${LB}`
    : "";

  const Experience = row["If Yes How Was Your Experience "]
    ? `If Yes How Was Your Experience: ${row["If Yes How Was Your Experience "]}${LB}`
    : "";

  const NoticeFreq = row["Notice Frequency"]
    ? `How Often is Waste Spotted: ${row["Notice Frequency"]}${LB}`
    : "";

  const Solution = row["Solution Suggested by Interviewee"]
    ? `Solution Suggested By Interviewee: ${row["Solution Suggested by Interviewee"]}${LB}`
    : "";

  const DisposeWhere = row["Where Interviewee Dispose Their Waste"]
    ? `Where Interviewee Disposes Their Waste: ${row["Where Interviewee Dispose Their Waste"]}${LB}`
    : "";

  const WhoDispose = row["Who Dispose"]
    ? `Who disposes The Waste: ${row["Who Dispose"]}${LB}`
    : "";

  const GenderWomen = row["No of Women"];
  const GenderMen = row["No of Men"];
  const GenderBlock =
    GenderWomen || GenderMen
      ? `Gender:${LB}${
          GenderWomen ? `• Women: ${GenderWomen}${LB}` : ""
        }${GenderMen ? `• Men: ${GenderMen}${LB}` : ""}`
      : "";

  const wasteReasonsMap = {
    "No Regular Collection Vehicle": "• No Regular Collection Vehicle",
    "Random People Throwing Garbage": "• Random People Throwing Garbage",
    "Due To User Fee": "• Due To User Fee",
    "Mismatch of Vehicle Time": "• Mismatch of Vehicle Time",
    "Due to Narrow Road": "• Due to Narrow Road",
    "Because of Market and Street Vendors": "• Because of Market and Street Vendors",
  };

  const WasteReasons = Object.keys(wasteReasonsMap)
    .filter((k) => row[k] === 1 || row[k] === true)
    .map((k) => wasteReasonsMap[k])
    .join(LB);

  const WasteReasonsSection = WasteReasons
    ? `Reasons For Waste Accumulation:${LB}${WasteReasons}${LB}`
    : "";

  const WasteClear = row["Does Waste Clear Off"]
    ? `Does Waste Get Cleared Off: ${row["Does Waste Clear Off"]}${LB}`
    : "";

  const WasteClearWhen = row["When Waste Cleared Off"]
    ? `When Waste Cleared Off: ${row["When Waste Cleared Off"]}${LB}`
    : "";

  const problemsMap = {
    "Bad Odour": "• Bad Odour",
    Mosquitos: "• Mosquitos",
    "Stray Animals": "• Stray Animals",
    Congestion: "• Congestion",
    Other: "• Other",
  };

  const ProblemsFlags = Object.keys(problemsMap)
    .filter((k) => row[k] === 1 || row[k] === true)
    .map((k) => problemsMap[k])
    .join(LB);

  const OtherProblemText = row["Other Problem Face"];
  const ProblemsCombined =
    ProblemsFlags && OtherProblemText
      ? ProblemsFlags + LB + `• ${OtherProblemText}`
      : ProblemsFlags || (OtherProblemText ? `• ${OtherProblemText}` : "");

  const ProblemsSection = ProblemsCombined
    ? `Problems Faced:${LB}${ProblemsCombined}${LB}`
    : "";

  const Section_Interaction_Body =
    CivicSession +
    Complained +
    Experience +
    NoticeFreq +
    Solution +
    DisposeWhere +
    WhoDispose +
    GenderBlock +
    WasteReasonsSection +
    WasteClear +
    WasteClearWhen +
    ProblemsSection;

  const Section_Interaction = Section_Interaction_Body
    ? `Information Shared by Citizens${LB}${Section_Interaction_Body}`
    : "";

  return [Section_GVP, Section_Interaction].filter(Boolean).join(LB + LB);
};

// DataTable Component
const DataTable = ({ data, onRowClick, selectedRowIndex }) => {
  const tableData = [...data.filter((row) => row["Type_of_Form"] === "form_for_gvp")].sort((a, b) => {
    const wardA = a["GVP Ward"] ? Number(a["GVP Ward"]) : Infinity;
    const wardB = b["GVP Ward"] ? Number(b["GVP Ward"]) : Infinity;
    return wardA - wardB;
  });

  const rowColors = [
    "#FFEBEE",
    "#FFF3E0",
    "#FFF9C4",
    "#E8F5E9",
    "#E3F2FD",
    "#F3E5F5",
    "#ECEFF1",
    "#FFFDE7",
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
    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full h-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Photos and Videos of Garbage Points
      </h2>
      <div className="overflow-y-auto h-[420px]">
        <table className="min-w-full divide-y divide-gray-200 table-fixed text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                GVP Ward
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 fonts-medium uppercase">
                Nearest Location
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Photo URL
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Video URL
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.slice(0, 50).map((row, index) => {
              const isSelected = selectedRowIndex === index;
              return (
                <tr
                  key={index}
                  className="hover:bg-yellow-50/50 transition duration-150 cursor-pointer"
                  style={{
                    height: "40px",
                    backgroundColor: isSelected
                      ? "#FFD54F"
                      : rowColors[index % rowColors.length],
                  }}
                  onClick={() => onRowClick(index)}
                >
                  <td className="px-4 text-sm font-medium text-gray-900">
                    {row["GVP Ward"] || "N/A"}
                  </td>
                  <td className="px-4 text-sm text-gray-700">
                    {row["Nearest Location"] || "N/A"}
                  </td>
                  <td className="px-4 text-sm text-blue-600 hover:text-blue-800">
                    {row["Photo URL"] ? (
                      <a
                        href={row["Photo URL"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Photo
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-4 text-sm text-blue-600 hover:text-blue-800">
                    {row["Video URL"] ? (
                      <a
                        href={row["Video URL"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Video
                      </a>
                    ) : (
                      "N/A"
                    )}
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

// Colors for pie chart
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A020F0",
  "#DC143C",
  "#2E8B57",
  "#808080",
];

// Ward-specific color names for map markers
const WARD_COLOR_MAP = {
  "12": "red",
  "13": "green",
  "14": "blue",
  "15": "orange",
};

// Colors for bar charts
const BAR_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A020F0",
];

// Card size classes
const CARD_SIZE_CLASSES = "w-[250px] h-32";

// Custom label for BarCharts
const renderCustomBarLabel = ({ x, y, width, value, height }) => {
  return (
    <text
      x={x + width + 20}
      y={y + height / 2}
      fill="#333"
      textAnchor="start"
      dominantBaseline="middle"
      style={{ fontSize: "14px", fontWeight: "bold" }}
    >
      {`${value.toFixed(1)}%`}
    </text>
  );
};

// Calculate Problems Data with Normalization
const calculateProblemsData = (data) => {
  const problemsCount = {
    "Bad Odour": 0,
    Mosquitos: 0,
    "Stray Animals": 0,
    Congestion: 0,
    Other: 0,
  };
  data.forEach((row) => {
    Object.keys(problemsCount).forEach((problem) => {
      if (row[problem] === 1) problemsCount[problem] += 1;
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
    Object.keys(reasonsCount).forEach((reason) => {
      if (row[reason] === 1 || row[reason] === true) reasonsCount[reason] += 1;
    });
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
      "जवळ पास चे लोक आणि रस्त्यावरून जाणाऱ्या लोक",
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
  const disposeCount = categoryMap.reduce((acc, { category }) => {
    acc[category] = 0;
    return acc;
  }, {});

  data.forEach((row) => {
    const columns = ["Who Dispose1", "Who Dispose2", "Who Dispose3"];
    columns.forEach((col) => {
      const disposeValue = row[col];
      if (disposeValue && disposeValue.trim() !== "" && disposeValue !== "N/A") {
        const category = categorize(disposeValue);
        if (category) {
          disposeCount[category] = (disposeCount[category] || 0) + 1;
        } else {
          disposeCount["Others"] = (disposeCount["Others"] || 0) + 1;
        }
      }
    });
  });

  const allData = Object.entries(disposeCount).map(([name, count]) => ({ name, count }));
  const totalCount = allData.reduce((sum, item) => sum + item.count, 0);
  if (totalCount === 0) {
    return categoryMap.map(({ category }) => ({ name: category, value: 0 }));
  }
  return allData
    .map((item) => ({
      name: item.name,
      value: (item.count / totalCount) * 100,
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
  const settingCount = {};
  data.forEach((row) => {
    const settingValue = row["In_what_setting_is_the_GVP_pre"] || row["Location Type"] || row["other"] || "";
    const category = categorizeLocation(settingValue);
    settingCount[category] = (settingCount[category] || 0) + 1;
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
  const solutionCount = solutionCategories.reduce((acc, { category }) => {
    acc[category] = 0;
    return acc;
  }, {});

  data.forEach((row) => {
    const columns = [
      "Solution Suggested by Interviewee1",
      "Solution Suggested by Interviewee2",
      "Solution Suggested by Interviewee3",
    ];
    columns.forEach((col) => {
      const solutionValue = row[col];
      if (solutionValue && solutionValue.trim() !== "" && solutionValue !== "N/A") {
        const category = categorizeSolution(solutionValue);
        if (category) {
          solutionCount[category] = (solutionCount[category] || 0) + 1;
        }
      }
    });
  });

  const allData = Object.entries(solutionCount).map(([name, count]) => ({ name, count }));
  const totalCount = allData.reduce((sum, item) => sum + item.count, 0);
  if (totalCount === 0) {
    return solutionCategories.map(({ category }) => ({
      name: category,
      value: 100 / solutionCategories.length,
    }));
  }
  return allData.map((item) => ({
    name: item.name,
    value: totalCount > 0 ? (item.count / totalCount) * 100 : 0,
  })).sort((a, b) => b.value - a.value);
};

function App() {
  const [allData, setAllData] = useState([]);
  const [selectedWards, setSelectedWards] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetch("/data_cleaned.json")
      .then((res) => res.json())
      .then((json) => setAllData(json));
  }, []);

  const uniqueWards = useMemo(() => {
    const wardsSet = new Set(
      allData
        .map((row) =>
          row["GVP Ward"] !== null && row["GVP Ward"] !== undefined
            ? String(row["GVP Ward"])
            : null
        )
        .filter(Boolean)
    );
    return Array.from(wardsSet).sort((a, b) => Number(a) - Number(b));
  }, [allData]);

  const filteredData = useMemo(() => {
    return allData.filter(
      (row) =>
        selectedWards.length === 0 ||
        selectedWards.includes(String(row["GVP Ward"]))
    );
  }, [allData, selectedWards]);

  const filteredTableData = filteredData.filter(
    (row) => row["Type_of_Form"] === "form_for_gvp"
  );

  const selectedRow = selectedRowIndex !== null ? filteredTableData[selectedRowIndex] : null;

  useEffect(() => {
    if (mapInstance && selectedRow) {
      const lat = Number(selectedRow["GVP Latitude"]);
      const lng = Number(selectedRow["GVP Longitude"]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        try {
          mapInstance.flyTo([lat, lng], Math.max(mapInstance.getZoom(), 15), {
            animate: true,
            duration: 0.6,
          });
        } catch (e) {}
      }
    }
  }, [selectedRow, mapInstance]);

  useEffect(() => {
    setSelectedRowIndex(null);
  }, [selectedWards, allData]);

  const filteredDataForCards = selectedRow ? [selectedRow] : filteredTableData;

  const totalGarbagePoints = filteredDataForCards.length;

  const totalHathGadiVolume = filteredDataForCards.reduce((sum, row) => {
    const quantity = row["Approx Waste Quantity Found at GVP"];
    const weight = getWasteWeight(quantity);
    return sum + weight;
  }, 0);

  const pieData = selectedRow
    ? calculatePieForRow(selectedRow)
    : calculateWasteTypeCounts(filteredDataForCards);

  const problemsData = calculateProblemsData(filteredDataForCards);

  const reasonsData = calculateReasonsData(filteredDataForCards);

  const whoDisposeData = calculateWhoDisposeData(filteredDataForCards);

  const settingData = calculateSettingData(filteredDataForCards);

  const solutionData = calculateSolutionData(filteredDataForCards);

  const mapCenter = [21.135, 79.085];

  const handleMarkerClick = (row) => {
    const keyOfRow = `${row["GVP Latitude"]}-${row["GVP Longitude"]}-${row["GVP Ward"]}`;
    const idx = filteredTableData.findIndex(
      (r) => `${r["GVP Latitude"]}-${r["GVP Longitude"]}-${r["GVP Ward"]}` === keyOfRow
    );

    if (idx !== -1) {
      if (selectedRowIndex === idx) {
        setSelectedRowIndex(null);
      } else {
        setSelectedRowIndex(idx);
      }
      if (mapInstance) {
        const lat = Number(row["GVP Latitude"]);
        const lng = Number(row["GVP Longitude"]);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          try {
            mapInstance.flyTo([lat, lng], 15, { animate: true, duration: 0.5 });
          } catch (e) {}
        }
      }
    }
  };

  const handleRowClick = (rowIndex) => {
    if (selectedRowIndex === rowIndex) {
      setSelectedRowIndex(null);
    } else {
      setSelectedRowIndex(rowIndex);
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

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen font-sans">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        Nagpur Garbage Dashboard
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT COLUMN - Full width on mobile */}
        <div className="w-full lg:w-[460px] space-y-6  lg:">

          {/* 1. Summary Cards */}
          <div className="flex flex-row flex-nowrap gap-4 overflow-x-auto pb-2 ">
            <div className={`bg-white p-4 rounded-lg shadow-lg text-center border-b-4 border-yellow-500 flex flex-col justify-center ${CARD_SIZE_CLASSES}`}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Total Garbage Points
              </h2>
              <p className="text-5xl font-extrabold mt-1 text-gray-900">
                {totalGarbagePoints}
              </p>
            </div>

            <div className={`bg-white p-4 rounded-lg shadow-lg text-center border-b-4 border-green-500 flex flex-col justify-center ${CARD_SIZE_CLASSES}`}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                GVP Waste Volume (Hath Gadi)
              </h2>
              <p className="text-5xl font-extrabold mt-1 text-gray-900">
                {Math.round(totalHathGadiVolume)}
              </p>
            </div>
          </div>

          {/* 3. Ward Selector */}
          <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 relative ">
            <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">Wards</h2>
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="w-full p-2 border rounded-lg shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-yellow-500 flex justify-between items-center"
              >
                {selectedWards.length > 0
                  ? `${selectedWards.length} ward(s) selected`
                  : "Select Wards"}
                <span className="ml-2">Down Arrow</span>
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <label className="flex items-center space-x-2 p-2 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedWards.length === uniqueWards.length}
                      onChange={handleSelectAll}
                      className="form-checkbox h-4 w-4 text-yellow-500"
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
                        className="form-checkbox h-4 w-4 text-yellow-500"
                      />
                      <span className="text-sm">{ward}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. Table */}
          <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 h-[500px] ">
            <DataTable
              data={selectedRow ? [selectedRow] : filteredDataForCards}
              onRowClick={handleRowClick}
              selectedRowIndex={selectedRowIndex}
            />
          </div>

          {/* 5. Pie Chart */}
          <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 ">
            <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
              Breakdown by Waste Type
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={60}
                  label={renderCustomizedLabel}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 10. Solutions Chart */}
          <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 ">
            <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
              Top Solutions Suggested (by Citizens)
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={solutionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 14 }} />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Bar dataKey="value" barSize={20} label={renderCustomBarLabel}>
                  {solutionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT COLUMN - Map + Key Findings */}
        <div className="flex-1  lg:">

          {/* 2. Map */}
          <div className="h-[600px] lg:h-[700px] ">
            <MapContainer
              whenCreated={setMapInstance}
              center={mapCenter}
              zoom={13}
              className="w-full h-full rounded-lg shadow-lg border border-gray-200"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {(selectedRow ? [selectedRow] : filteredDataForCards)
                .filter((row) => row["GVP Latitude"] && row["GVP Longitude"])
                .map((row, idx) => {
                  const lat = Number(row["GVP Latitude"]);
                  const lng = Number(row["GVP Longitude"]);
                  const ward = row["GVP Ward"] || "";
                  const stableKey = `${ward}-${lat}-${lng}-${idx}`;

                  const colorName = WARD_COLOR_MAP[ward] || "blue";

                  const customIcon = new L.Icon({
                    iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${colorName}.png`,
                    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${colorName}.png`,
                    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41],
                  });

                  return (
                    <Marker
                      key={stableKey}
                      position={[lat, lng]}
                      icon={customIcon}
                      eventHandlers={{
                        click: () => handleMarkerClick(row),
                      }}
                    >
                      <LeafletTooltip
                        direction="auto"
                        offset={[0, -20]}
                        opacity={1}
                        sticky={true}
                        permanent={false}
                        interactive={true}
                        className="rounded shadow-lg p-0 custom-tooltip"
                      >
                        <div
                          style={{
                            maxWidth: 700,
                            minWidth: 400,
                            minHeight: 400,
                            overflow: "visible",
                            whiteSpace: "pre-wrap",
                            fontSize: 12,
                            lineHeight: 1.0,
                            padding: 12,
                            background: "white",
                            borderRadius: 10,
                            boxShadow: "0 8px 22px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.08)",
                          }}
                        >
                          <div style={{ marginBottom: 8, fontWeight: 700 }}>
                            Garbage Point Info
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            {getGarbagePointInfo(row)}
                          </div>
                        </div>
                      </LeafletTooltip>
                    </Marker>
                  );
                })}
            </MapContainer>
          </div>

          <h2 className="text-2xl font-bold mt-8 text-center text-black ">
            Key Findings from the GVP Survey
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

            <div className="space-y-6">
              {/* 6. Problems */}
              <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 ">
                <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                  Top Problems Faced by Residents around GVP
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={problemsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 14 }} />
                    <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                    <Bar dataKey="value" barSize={20} label={renderCustomBarLabel}>
                      {problemsData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 8. Settings */}
              <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 ">
                <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                  Top Settings Where GVPs Are Found
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={settingData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="name" type="category" width={200} tick={{ fontSize: 14 }} />
                    <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                    <Bar dataKey="value" barSize={20} label={renderCustomBarLabel}>
                      {settingData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              {/* 7. Who Dispose - FIXED */}
              <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 ">
                <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                  Who is Disposing the most Waste (as per Citizens)
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={whoDisposeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 14 }} />
                    <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                    <Bar dataKey="value" barSize={20} label={renderCustomBarLabel}>
                      {whoDisposeData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 9. Reasons */}
              <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 ">
                <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">
                  Reasons for Waste Accumulation
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={reasonsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="name" type="category" width={250} tick={{ fontSize: 14 }} />
                    <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
                    <Bar dataKey="value" barSize={20} label={renderCustomBarLabel}>
                      {reasonsData.map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;